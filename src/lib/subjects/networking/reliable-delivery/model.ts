import { EventQueue } from '#lib/platform/engine/events.ts';
import type { Frame, Model } from '#lib/platform/engine/model.ts';
import { createRng } from '#lib/platform/engine/rng.ts';
import type { MessageValues } from '#lib/platform/i18n/translate.ts';
import type { DeliveryValues } from './parameters.ts';

/** Time the sender needs to put one packet on the link, in virtual ms. */
export const TRANSMISSION = 80;

export interface Message {
	id: number;
	kind: 'data' | 'ack';
	/** For data its number; for an ACK the number expected next. */
	number: number;
	sentAt: number;
	arrivesAt: number;
	/** Moment it disappears, if it is lost. */
	lostAt: number | null;
}
export interface DeliveryState {
	total: number;
	window: number;
	/** Everything before this number is acknowledged. */
	base: number;
	/** First number that has not been sent yet. */
	highest: number;
	/** Numbers delivered in order to the receiving application. */
	delivered: number[];
	messages: Message[];
	timerEndsAt: number | null;
	/** Milliseconds of history that the drawing may show. */
	span: number;
}

export const model: Model<DeliveryValues, DeliveryState> = {
	*run({ params, seed }) {
		const link = new ReliableLink(params, seed);
		link.emit('start', { total: params.packets });
		link.fillWindow();
		do {
			yield* link.frames.splice(0);
		} while (!link.finished && link.clock.next());
	}
};

// Stop-and-wait is Go-Back-N with a window of one packet.
class ReliableLink {
	readonly clock = new EventQueue();
	frames: Frame<DeliveryState>[] = [];
	private rng;
	private window: number;
	private span: number;
	private base = 0;
	private next = 0;
	private highest = 0;
	private expected = 0;
	private delivered: number[] = [];
	private messages: Message[] = [];
	private sending = false;
	/** Starting a new timer makes the earlier ones void. */
	private timer = 0;
	private timerEndsAt: number | null = null;
	private stats = { sent: 0, resent: 0, lost: 0, delivered: 0, throughput: 0 };

	constructor(
		private params: DeliveryValues,
		seed: number
	) {
		this.rng = createRng(seed);
		this.window = params.protocol === 'stop-and-wait' ? 1 : params.window;
		this.span = Math.max(2000, params.latency * 5);
	}

	get finished() {
		return this.base >= this.params.packets;
	}

	emit(key: string, values: MessageValues = {}) {
		const { now } = this.clock;
		this.messages = this.messages.filter((m) => (m.lostAt ?? m.arrivesAt) > now - this.span);
		this.stats.delivered = this.delivered.length;
		this.stats.throughput = now > 0 ? this.delivered.length / (now / 1000) : 0;
		this.frames.push({
			t: now,
			state: {
				total: this.params.packets,
				window: this.window,
				base: this.base,
				highest: this.highest,
				delivered: this.delivered,
				messages: this.messages,
				timerEndsAt: this.timerEndsAt,
				span: this.span
			},
			explain: { key, values },
			stats: { ...this.stats }
		});
	}

	fillWindow() {
		if (this.sending || this.finished) return;
		if (this.next >= Math.min(this.base + this.window, this.params.packets)) return;
		const number = this.next++;
		const again = number < this.highest;
		this.highest = Math.max(this.highest, this.next);
		this.stats.sent++;
		if (again) this.stats.resent++;
		if (this.timerEndsAt === null) this.startTimer();
		this.transmit('data', number, () => this.receiveData(number));
		this.emit(again ? 'resend' : 'send', { number });
		this.sending = true;
		this.clock.after(TRANSMISSION, () => {
			this.sending = false;
			this.fillWindow();
		});
	}

	private transmit(kind: Message['kind'], number: number, onArrival: () => void) {
		const { now } = this.clock;
		const duration = (kind === 'data' ? TRANSMISSION : 0) + this.params.latency;
		const lost = this.rng() * 100 < this.params.loss;
		const message: Message = {
			id: this.messages.length ? this.messages.at(-1)!.id + 1 : 0,
			kind,
			number,
			sentAt: now,
			arrivesAt: now + duration,
			lostAt: lost ? now + duration * (0.3 + 0.5 * this.rng()) : null
		};
		this.messages = [...this.messages, message];
		if (message.lostAt === null) return this.clock.after(duration, onArrival);
		this.clock.at(message.lostAt, () => {
			this.stats.lost++;
			this.emit(`lost.${kind}`, { number });
		});
	}

	private receiveData(number: number) {
		const key =
			number === this.expected
				? 'receive.inOrder'
				: number < this.expected
					? 'receive.duplicate'
					: 'receive.outOfOrder';
		if (number === this.expected) {
			this.delivered = [...this.delivered, number];
			this.expected++;
		}
		const ack = this.expected;
		this.transmit('ack', ack, () => this.receiveAck(ack));
		this.emit(key, { number, ack });
	}

	private receiveAck(ack: number) {
		if (ack <= this.base) return this.emit('ack.old', { ack });
		this.base = ack;
		this.next = Math.max(this.next, ack);
		if (this.finished) {
			this.timerEndsAt = null;
			return this.emit('finished', { total: this.params.packets, sent: this.stats.sent });
		}
		if (this.next > this.base) this.startTimer();
		else this.stopTimer();
		this.emit('ack.new', { ack });
		this.fillWindow();
	}

	private startTimer() {
		const timer = ++this.timer;
		this.timerEndsAt = this.clock.now + this.params.timeout;
		this.clock.after(this.params.timeout, () => {
			if (timer !== this.timer || this.timerEndsAt === null) return;
			this.next = this.base;
			this.timerEndsAt = null;
			this.emit('timeout', { number: this.base });
			this.fillWindow();
		});
	}

	private stopTimer() {
		this.timer++;
		this.timerEndsAt = null;
	}
}
