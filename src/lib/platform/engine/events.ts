/** Discrete-event clock for models in continuous time. Events at the same moment run in scheduling order. */
export class EventQueue {
	now = 0;
	private sequence = 0;
	private events: { t: number; sequence: number; run: () => void }[] = [];

	at(t: number, run: () => void) {
		const event = { t: Math.max(t, this.now), sequence: this.sequence++, run };
		let index = this.events.length;
		while (index > 0 && this.events[index - 1]!.t > event.t) index--;
		this.events.splice(index, 0, event);
	}

	after(delay: number, run: () => void) {
		this.at(this.now + delay, run);
	}

	/** Runs the next event; false when there are none left. */
	next(): boolean {
		const event = this.events.shift();
		if (!event) return false;
		this.now = event.t;
		event.run();
		return true;
	}
}
