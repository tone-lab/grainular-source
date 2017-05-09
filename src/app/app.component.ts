import {AfterViewInit, Component, ElementRef, NgZone, ViewChild} from '@angular/core';

const GrainPlayer = require('tone').GrainPlayer;
const Transport = require('tone').Transport;
const Master = require('tone').Master;
const Gain = require('tone').Gain;
const AutoFilter = require('tone').AutoFilter;
const Freeverb = require('tone').Freeverb;
const Compressor = require('tone').Compressor;

import { map, chunk, sum, first } from 'lodash';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

    @ViewChild('wave') wave: ElementRef;

    /*
     Cow and Calf sound provided by Felix Blume
     http://www.freesound.org/people/felix.blume/sounds/391026/
     */

    grain;
    isLoaded = false;
    gain;
    filter;
    spectrum = "M 0 0";
    playerSize = 0;

    pt: SVGPoint;
    reverb;
    comp;

    constructor(private zone: NgZone) {
        this.grain = new GrainPlayer('assets/sounds/cow-and-calf.wav', () => {
            this.isLoaded = true;
            this.zone.run(() => {

                // sample has loaded - generate points for SVG wave:
                const bandSize = 2048;
                const bands =
                    map(
                        chunk(
                            this.grain.buffer.getChannelData(0), bandSize), i => first(i));

                const line = map(bands, (v, i) => `L ${i} ${(v * 256) + 256}`).join(' ');
                this.spectrum = 'M 0 256 ' + line;
                this.playerSize = bands.length;

                // start playing:
                this.grain.start();
            })
        });

        this.filter = new AutoFilter("4m", 800).start();

        this.gain = new Gain();
        this.gain.connect(Master);

        this.reverb = new Freeverb();

        this.filter.depth.value = 1;
        this.filter.connect(this.reverb);
        this.grain.connect(this.filter);

        this.reverb.roomSize.value = 1;
        Transport.start();

        this.grain.grainSize = 0.015;
        this.grain.overlap = 0.25;
        this.grain.detune = -600;
        this.grain.playbackRate = 0.2;
        this.grain.drift = 0.05;

        this.comp = new Compressor();
        this.comp.connect(this.gain);
        this.reverb.connect(this.comp);

    }

    ngAfterViewInit()
    {
        this.pt = this.wave.nativeElement.createSVGPoint();

    }

    get path() {
        return this.spectrum;
    }

    skip(e: MouseEvent) {
        if (this.pt) {
            this.pt.x = e.clientX;
            this.pt.y = e.clientY;

            const cursorPoint = this.pt.matrixTransform(
                this.wave.nativeElement.getScreenCTM().inverse());
            console.log(cursorPoint);

            const duration = this.grain.buffer.duration;
            const seekToPercent = cursorPoint.x / this.playerSize;
            this.grain.scrub(duration * seekToPercent);
        }
    }

    start() {
        this.gain.gain.value = 0.75;
        this.grain.start();
    }
    stop() {
        this.gain.gain.value = 0;
    }
}
