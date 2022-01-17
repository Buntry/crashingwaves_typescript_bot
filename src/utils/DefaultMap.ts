// Utility class for items with default collections
export default class DefaultMap<K,V> extends Map<K, V> {
    fn : () => V

    constructor(fn: () => V) {
        super()
        this.fn = fn
    }

    get(key: K): V {
        if (super.has(key)) {
            return super.get(key) || this.fn()
        } else {
            const value : V = this.fn()
            super.set(key, value)
            return value
        }
    }
}