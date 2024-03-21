class RenderCapacityProcessor extends AudioWorkletProcessor {

    constructor (options) {
        super(options);
        this._exp = 1;
        this._pause = false;
        this._sum = 0.0;
        this._initial_state = false;
        this._measure_state = false;
        this._measure_frac = 0.0;

        this.port.onmessage = event => {
            this._sum = 0.0;
            if (this._exp == 1) {
                this._initial_state = true;
            } else if (this._initial_state) {
                this._initial_state = false;
                this.port.postMessage({load: this._exp});
            } else if (!this._measure_state) {
                this._measure_state = true;
                this._measure_frac = 0.0;
            } else {
                this._measure_state = false;
                this.port.postMessage({load: this._measure_frac});
            }
        }

        this.port.onmessageerror = (e) => {
            console.log('render msg error', e)
        }

        this.port.start();
    }

    process(inputs, outputs, parameters) {
        if (this._initial_state) {
            if (this._pause) {
                this._pause = false;
            } else {
                this._exp *= 2;
                for (var i=0; i<this._exp; i++) {
                    this._sum += Math.sin(Math.random());
                }
                this._pause = true;
            }
        } else if (this._measure_state) {
            if (this._measure_frac < 1.) {
                this._measure_frac += 0.01;
                for (var i=0; i<this._exp * this._measure_frac; i++) {
                    this._sum += Math.sin(Math.random());
                }
            }
        }

        return true;
    }
}

registerProcessor("render-capacity-processor", RenderCapacityProcessor);
