import { EventQueue } from '#lib/platform/engine/events.ts';
import type { Frame, Model } from '#lib/platform/engine/model.ts';
import type { MessageValues } from '#lib/platform/i18n/translate.ts';
import type { RoutingValues } from './parameters.ts';
import { RECEIVER, SENDER, topologies, type Link, type Topology } from './topologies.ts';

/** How long a link is occupied by one packet, in virtual ms. */
export const TRANSMISSION = 100;
/** How long the drawing keeps showing a lost or delivered packet. */
export const AFTERGLOW = 800;

export type DropReason = 'linkDown' | 'noRoute' | 'ttl' | 'queueFull';
export interface PacketState {
	id: number;
	status: 'waiting' | 'flying' | 'delivered' | 'dropped';
	/** Node it is at, or last left. */
	at: string;
	/** Next node while waiting or flying. */
	to: string | null;
	depart: number;
	arrive: number;
	ttl: number;
	/** Moment of delivery or loss. */
	endedAt: number;
	reason?: DropReason;
}
export interface Route {
	next: string | null;
	cost: number;
}
export type Table = Record<string, Route>;
export interface RoutingState {
	topology: Topology;
	packets: PacketState[];
	down: string[];
	tables: Record<string, Table>;
}
export interface ToggleLink {
	toggle: string;
}

/** Shortest routes from one node, over the links it believes to be up. */
export function computeTable(
	{ nodes, links }: Topology,
	from: string,
	down: ReadonlySet<string>,
	metric: RoutingValues['metric']
): Table {
	const table: Table = Object.fromEntries(
		nodes.map(({ id }) => [id, { next: null, cost: id === from ? 0 : Infinity }])
	);
	const open = new Set(nodes.map(({ id }) => id));
	while (open.size) {
		const here = [...open].reduce((a, b) => (table[b]!.cost < table[a]!.cost ? b : a));
		open.delete(here);
		if (table[here]!.cost === Infinity) break;
		for (const link of links) {
			if (down.has(link.id) || (link.a !== here && link.b !== here)) continue;
			const there = link.a === here ? link.b : link.a;
			const cost = table[here]!.cost + (metric === 'hops' ? 1 : link.latency);
			if (cost < table[there]!.cost) {
				table[there] = { cost, next: here === from ? there : table[here]!.next };
			}
		}
	}
	return table;
}

export const model: Model<RoutingValues, RoutingState, ToggleLink> = {
	*run({ params, actions }) {
		const network = new Network(params);
		for (const { t, action } of actions) {
			network.clock.at(t, () => network.toggle(action.toggle));
		}
		network.emit('start', { count: params.packets });
		for (let id = 1; id <= params.packets; id++) {
			network.clock.at((id - 1) * params.interval, () => network.send(id));
		}
		do {
			yield* network.frames.splice(0);
		} while (network.clock.next());
		// Leaves time to see the last packet disappear.
		network.clock.at(network.clock.now + AFTERGLOW, () => network.emit('finished', network.stats));
		network.clock.next();
		yield* network.frames.splice(0);
	}
};

/** One direction of a link: one packet at a time, the others wait in line. */
interface Lane {
	busy: boolean;
	line: number[];
}

class Network {
	readonly clock = new EventQueue();
	frames: Frame<RoutingState>[] = [];
	stats = { sent: 0, delivered: 0, dropped: 0, inNetwork: 0 };
	private topology: Topology;
	private packets: PacketState[] = [];
	private down = new Set<string>();
	private tables: Record<string, Table> = {};
	/** What each node believes to be down; news arrives late. */
	private believes = new Map<string, Set<string>>();
	private newest = new Map<string, number>();
	private heard = new Map<string, number>();
	private lanes = new Map<string, Lane>();

	constructor(private params: RoutingValues) {
		this.topology = topologies[params.topology];
		for (const { id } of this.topology.nodes) {
			this.believes.set(id, new Set());
			this.recompute(id);
		}
	}

	emit(key: string, values: MessageValues = {}) {
		this.frames.push({
			t: this.clock.now,
			state: {
				topology: this.topology,
				packets: this.packets,
				down: [...this.down],
				tables: this.tables
			},
			explain: { key, values },
			stats: { ...this.stats }
		});
	}

	send(id: number) {
		this.stats.sent++;
		this.stats.inNetwork++;
		const packet: PacketState = {
			id,
			status: 'waiting',
			at: SENDER,
			to: null,
			depart: 0,
			arrive: 0,
			ttl: this.params.ttl,
			endedAt: 0
		};
		this.packets = [...this.packets, packet];
		this.emit('sent', { packet: id });
		this.forward(id);
	}

	toggle(linkId: string) {
		const link = this.topology.links.find(({ id }) => id === linkId);
		if (!link) return;
		const broken = !this.down.has(linkId);
		if (broken) this.down.add(linkId);
		else this.down.delete(linkId);
		this.emit(broken ? 'link.down' : 'link.up', { a: link.a, b: link.b });
		if (broken) {
			for (const packet of this.packets) {
				const on = packet.status === 'flying' || packet.status === 'waiting';
				if (on && packet.to && this.linkBetween(packet.at, packet.to).id === linkId) {
					this.drop(packet.id, 'linkDown');
				}
			}
		}
		this.spreadNews(link, broken);
	}

	/** Nodes further from the change hear about it later, so tables disagree for a while. */
	private spreadNews(link: Link, broken: boolean) {
		const version = (this.newest.get(link.id) ?? 0) + 1;
		this.newest.set(link.id, version);
		for (const [node, distance] of this.distancesFrom([link.a, link.b])) {
			this.clock.after(this.params.convergence * (1 + distance), () => {
				const key = `${node} ${link.id}`;
				if ((this.heard.get(key) ?? 0) >= version) return;
				this.heard.set(key, version);
				const believed = this.believes.get(node)!;
				if (broken) believed.add(link.id);
				else believed.delete(link.id);
				this.recompute(node);
				this.emit('table', { node });
			});
		}
	}

	private distancesFrom(start: string[]): Map<string, number> {
		const distances = new Map(start.map((id) => [id, 0]));
		// A Map visits entries added during the loop, which makes this a breadth-first search.
		for (const [here, distance] of distances) {
			for (const link of this.topology.links) {
				if (this.down.has(link.id) || (link.a !== here && link.b !== here)) continue;
				const there = link.a === here ? link.b : link.a;
				if (!distances.has(there)) distances.set(there, distance + 1);
			}
		}
		return distances;
	}

	private recompute(node: string) {
		const table = computeTable(this.topology, node, this.believes.get(node)!, this.params.metric);
		this.tables = { ...this.tables, [node]: table };
	}

	private linkBetween(a: string, b: string): Link {
		return this.topology.links.find(
			(link) => (link.a === a && link.b === b) || (link.a === b && link.b === a)
		)!;
	}

	private lane(from: string, to: string): Lane {
		const key = `${from} ${to}`;
		if (!this.lanes.has(key)) this.lanes.set(key, { busy: false, line: [] });
		return this.lanes.get(key)!;
	}

	private packet = (id: number) => this.packets.find((packet) => packet.id === id)!;

	private update(id: number, change: Partial<PacketState>) {
		this.packets = this.packets.map((p) => (p.id === id ? { ...p, ...change } : p));
	}

	private forward(id: number) {
		const { at } = this.packet(id);
		const next = this.tables[at]![RECEIVER]!.next;
		if (!next) return this.drop(id, 'noRoute');
		// The node may not know yet that this link is broken.
		if (this.down.has(this.linkBetween(at, next).id)) return this.drop(id, 'linkDown');

		const lane = this.lane(at, next);
		if (!lane.busy) return this.transmit(id, next);
		if (lane.line.length >= this.params.queueSize) return this.drop(id, 'queueFull');
		lane.line.push(id);
		this.update(id, { status: 'waiting', to: next });
		this.emit('wait', { packet: id, node: at, next });
	}

	private transmit(id: number, next: string) {
		const { at } = this.packet(id);
		const link = this.linkBetween(at, next);
		const lane = this.lane(at, next);
		const depart = this.clock.now;
		const arrive = depart + TRANSMISSION + link.latency;
		lane.busy = true;
		this.update(id, { status: 'flying', to: next, depart, arrive });
		this.emit('forward', { packet: id, node: at, next });

		this.clock.after(TRANSMISSION, () => {
			lane.busy = false;
			const following = lane.line.shift();
			if (following !== undefined) this.transmit(following, next);
		});
		this.clock.at(arrive, () => {
			// It may have been lost on the way.
			if (this.packet(id).status === 'flying') this.arrive(id, next);
		});
	}

	private arrive(id: number, node: string) {
		const ttl = this.packet(id).ttl - 1;
		this.update(id, { at: node, to: null, status: 'waiting', ttl });
		if (node === RECEIVER) {
			this.stats.delivered++;
			this.stats.inNetwork--;
			this.update(id, { status: 'delivered', endedAt: this.clock.now });
			return this.emit('delivered', { packet: id });
		}
		if (ttl <= 0) return this.drop(id, 'ttl');
		this.forward(id);
	}

	private drop(id: number, reason: DropReason) {
		const { at, to } = this.packet(id);
		if (to) {
			const lane = this.lane(at, to);
			lane.line = lane.line.filter((waiting) => waiting !== id);
		}
		this.stats.dropped++;
		this.stats.inNetwork--;
		this.update(id, { status: 'dropped', endedAt: this.clock.now, reason });
		this.emit(`drop.${reason}`, { packet: id, node: at });
	}
}
