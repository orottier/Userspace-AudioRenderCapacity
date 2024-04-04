class RenderCapacityProcessor extends AudioWorkletProcessor {

    constructor (options) {
        super(options);

        // 0: idle
        // 1: ramp load exponentially
        // 2: ramp load linearly
        this._state = 0;

        // number of flops needed for max load
        this._max_flops = 1;
        // fraction of max_flops we are currently testing
        this._load_factor = 0;

        // previous render quantum time (ms)
        this._prev_time = 0;
        // previous render quantum duration (ms)
        this._prev_duration = 0;
        
        // timestamps when starting the measurement
        this._start_time = 0;

        // just to make sure we track some side effects so the compiler won't drop our load
        this._sum = 0.0;

        this.port.onmessage = event => {
            this._state = event.data.state;
            this._sum = 0.0;
            this._prev_time = 0;
            this._prev_duration = 0.;
            this._start_time = 0;
            this._load_factor = 0;
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

        var time = Date.now();
        if (this._start_time == 0) {
            this._start_time = time;
        } else {
            var duration = time - this._prev_time;

            // calculate moving average of duration to combat dither
            this._prev_duration += duration;
            this._prev_duration /= 2;
        }
        this._prev_time = time;

        if (this._state == 1) {
            this._max_flops *= 2;

            if (this._prev_duration > 128 * 4 * 1000. / sampleRate) {
                this._state = 0;
                this.port.postMessage({"max_flops": this._max_flops});
                return true;
            }

            if (time - this._start_time > 500) {
                this._state = 0;
                this.port.postMessage({"limit": this._max_flops});
            } else {
                for (var i=0; i<this._max_flops; i++) {
                    this._sum += Math.sin(Math.random());
                }
            }
        } else if (this._state == 2) {
            if (this._prev_duration > 128 * 4 * 1000. / sampleRate) {
                this._state = 0;
                this.port.postMessage({"load_factor": this._load_factor});
                return true;
            }

            if (this._load_factor < 2.) {
                this._load_factor += 0.01;
                for (var i=0; i<this._max_flops * this._load_factor; i++) {
                    this._sum += Math.sin(Math.random());
                }
            } else {
                this._state = 0;
                this.port.postMessage({"measure_limit": this._load_factor});
            }
        }

        return true;
    }
}

registerProcessor("render-capacity-processor", RenderCapacityProcessor);
