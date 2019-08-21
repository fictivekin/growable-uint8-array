/**
     Create a new GrowableUint8Array
     * @param {Uint8Array} buf: Initial view
     * @param {number} expansionRate: How much to grow buffer
 */
export default function GrowableUint8Array(buf=null, expansionRate=2) {
    if (buf) {
        if (!(buf instanceof Uint8Array)) {
            throw new Error('Can only wrap Uint8Array instances');
        }
        this.buf = buf;
        this.bytesUsed = this.buf.length;
    } else {
        this.buf = new Uint8Array(parseInt(2 * (expansionRate ** 4)));
        this.bytesUsed = 0;
    }
    this.expansionRate = expansionRate;
}

GrowableUint8Array.from = function from(source) {
    return new GrowableUint8Array(Uint8Array.from(source));
};

GrowableUint8Array.of = function of(...args) {
    return new GrowableUint8Array(Uint8Array.of(...args));
};

/**
    Extend a GrowableUint8Array with new data
     * @param {Uint8Array} buf: new data to add
     * @return {GrowableUint8Array} new GrowableUint8Array
 */
GrowableUint8Array.prototype.extend = function extend(buf) {
    if (buf.length + this.length > this.buf.byteLength) {
        const oldBuf = this.buf;
        const newSize = Math.max(
            parseInt(this.buf.buffer.byteLength * this.expansionRate),
            buf.length + this.length + 1,
        );

        this.buf = new Uint8Array(newSize);
        this.buf.set(oldBuf);
    }

    this.buf.set(buf, this.length);
    this.bytesUsed += buf.length;
    return this;
};

/*
    Return a DataView of the underlying buffer, starting at the specified offset
    * @return {DataView}
*/
GrowableUint8Array.prototype.dataView = function dataView(offset=0) {
    return new DataView(this.buf.buffer, offset, this.length - offset);
};


Object.defineProperty(GrowableUint8Array.prototype, 'length', {
    get: function() {
        return this.bytesUsed;
    },
    set: function(_val) {
    },
});

Object.defineProperty(GrowableUint8Array.prototype, 'expansionRate', {
    get: function() {
        return this._expansionRate;
    },
    set: function(val) {
        if (val <= 1) {
            throw new RangeError('expansionRate must be greater than 1');
        }
        this._expansionRate = val;
    },
});

/*
    Returns the underlying Uint8Array buffer.
    * @param {boolean} copy Pass `true` to return a copy of the buffer.
    * @return {Uint8Array}
*/
GrowableUint8Array.prototype.unwrap = function unwrap(copy=false) {
    const unwrapped = this.buf.subarray(0, this.length);
    if (copy) {
        return unwrapped.slice();
    }
    return unwrapped;
};

/*
    Functions which simply pass their argument through to the underlying
    Uint8Array.
*/
const _PASSTHROUGH_FNS = [
    Symbol.iterator,
    'entries',
    'every',
    'find',
    'findIndex',
    'forEach',
    'includes',
    'indexOf',
    'join',
    'keys',
    'lastIndexOf',
    'reduce',
    'reduceRight',
    'set',
    'some',
    'values',
];

for (const fName of _PASSTHROUGH_FNS) {  // eslint-disable-line no-unused-vars
    GrowableUint8Array.prototype[fName] = function(...args) {
        return this.unwrap()[fName](...args);
    };
}

/*
    Functions which use the underlying Uint8Array function, but return an
    instance of GrowableUint8Array
*/
const _WRAP_FNS = [
    'copyWithin',
    'filter',
    'map',
    'reverse',
    'slice',
    'sort',
];

for (const fName of _WRAP_FNS) {  // eslint-disable-line no-unused-vars
    GrowableUint8Array.prototype[fName] = function(...args) {
        return new GrowableUint8Array(
            this.unwrap()[fName](...args),
            this.expansionRate,
        );
    };
}

GrowableUint8Array.prototype.fill = function fill(...args) {
    this.unwrap().fill(...args);
    return this;
}
