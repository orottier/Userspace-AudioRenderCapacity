class RenderCapacityProcessor extends AudioWorkletProcessor {

    constructor (options) {
        super(options);

        // 0: idle
        // 1: ramp load exponentially
        // 2: ramp load linearly
        this._state = 0;

        this._sab = null; // SharedArrayBuffer

        // number of flops needed for max load
        this._max_flops = 1;
        // fraction of max_flops we are currently testing
        this._load_factor = 0;

        // previous render quantum time (ms)
        this._prev_time = 0;

        // just to make sure we track some side effects so the compiler won't drop our load
        this._sum = 0.0;

        this.port.onmessage = event => {
            this._sum = 0.0;
            this._state = event.data.state;
            this._sab = new Int32Array(event.data.sab);
        }

        this.port.onmessageerror = (e) => {
            console.log('render msg error', e)
        }

        this.port.start();
    }

    process(inputs, outputs, parameters) {
        if (this._state == 0) {
            return true;
        }

        if (this._state == 1) {
            this._max_flops *= 2;
            var time = Atomics.load(this._sab, 0);
            var duration = time - this._prev_time;
            if (this._prev_time != 0 && duration > 128 * 2 * 1000000. / sampleRate) {
                console.log("duration", duration);
                console.log("time", time);
                console.log("max_flops", this._max_flops);
                console.log("done");
                this._state = 0;
                return true;
            }
            this._prev_time = time;
            if (time > 90000) {
                console.log("limit");
                this._state = 0;
            }
            for (var i=0; i<this.max_flops; i++) {
                //this._sum += Math.sin(Math.random());
            }
        } else if (this._state == 2) {
            if (this._load_factor < 1.) {
                this._load_factor += 0.01;
                for (var i=0; i<this._max_flops * this._load_factor; i++) {
                    this._sum += Math.sin(Math.random());
                }
            }
        }

        return true;
    }
}

registerProcessor("render-capacity-processor", RenderCapacityProcessor);
