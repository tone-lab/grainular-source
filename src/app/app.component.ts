import {AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild} from '@angular/core';

const GrainPlayer = require('tone').GrainPlayer;
const Transport = require('tone').Transport;
const Master = require('tone').Master;
const Gain = require('tone').Gain;
const AutoFilter = require('tone').AutoFilter;
const Freeverb = require('tone').Freeverb;
const Compressor = require('tone').Compressor;
const Time = require('tone').Time;

import { map, chunk, sum, first } from 'lodash';
import {Subscription} from "rxjs/Subscription";
import {Observable} from "rxjs/Observable";
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/repeat';
import {animationFrame} from "rxjs/scheduler/animationFrame";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {

    @ViewChild('wave') wave: ElementRef;

    /*
     Cow and Calf sound provided by Felix Blume
     http://www.freesound.org/people/felix.blume/sounds/391026/

     Ahh sound provided by hy96
     http://www.freesound.org/people/hy96/sounds/48171/
     */

    grain;
    grain2;
    grain3;
    isLoaded = false;
    gain;
    filter;
    filter2;
    filter3;
    spectrum = "M 0 0";
    playerSize = 0;

    pt: SVGPoint;
    reverb;
    comp;

    anim: Subscription;
    playPosition: number;

    ahh;
    ahhGain;

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
                this.grain.start(0);
                Transport.start();
            })
        });
        this.grain2 = new GrainPlayer('assets/sounds/cow-and-calf.wav', () => {
            this.isLoaded = true;
            this.zone.run(() => {
                // start playing:
                this.grain2.start(0);
                Transport.start();
            })
        });
        this.grain3 = new GrainPlayer('assets/sounds/cow-and-calf.wav', () => {
            this.isLoaded = true;
            this.zone.run(() => {
                // start playing:
                this.grain3.start(0);
                Transport.start();
            })
        });

        // this.ahhGain = new Gain();
        // this.ahh = new GrainPlayer('assets/sounds/ahh.wav', () => {
        //     this.ahh.start(0);
        // });

        this.filter = new AutoFilter("6m", 880).start();
        this.filter.filter.type = "highpass";
        this.filter.filter.Q.value = 2;

        this.filter2 = new AutoFilter("4m", 440).start();
        this.filter2.filter.type = "lowpass";

        this.filter3 = new AutoFilter("10m", 1440).start();
        this.filter3.filter.type = "highpass";

        this.gain = new Gain();
        this.gain.connect(Master);

        this.reverb = new Freeverb();

        this.filter.depth.value = 1;
        this.filter.connect(this.reverb);
        this.grain.connect(this.filter2);

        this.filter2.depth.value = 1;
        this.filter2.connect(this.reverb);

        this.filter3.depth.value = 1;
        this.filter3.connect(this.reverb);

        this.reverb.roomSize.value = 0.95;

        this.grain.grainSize = 0.015;
        this.grain.overlap = 0.25;
        this.grain.loop = true;
        this.grain.detune = -1200;
        this.grain.playbackRate = 0.2;
        this.grain.drift = 0.05;

        this.comp = new Compressor();
        this.comp.connect(this.gain);
        this.reverb.connect(this.comp);

        this.grain2.grainSize = 0.015;
        this.grain2.overlap = 0.25;
        this.grain2.loop = true;
        // this.grain2.detune = -1200;
        this.grain2.playbackRate = 0.2;
        this.grain2.drift = 0.05;
        this.grain2.connect(this.filter);

        this.grain3.grainSize = 0.15;
        this.grain3.overlap = 0.5;
        this.grain3.loop = true;
        this.grain3.detune = 1200;
        this.grain3.playbackRate = 0.2;
        this.grain3.drift = 0.75;
        this.grain3.connect(this.filter3);


        // this.ahh.detune = -600;
        // this.ahh.grainSize = 0.015;
        // this.ahh.overlap = 0.25;
        // this.ahh.playbackRate = 0.15;
        // this.ahh.connect(this.ahhGain);
        // this.ahhGain.connect(this.reverb);
        // this.ahhGain.gain.setValueAtTime(0, 0);
        // this.ahhGain.gain.linearRampToValueAtTime(1, 10);

        this.anim = Observable.of(0, animationFrame)
            .repeat()
            .subscribe(() => {



            });
    }

    ngOnDestroy() {
        this.anim.unsubscribe();
    }

    ngAfterViewInit()
    {
        this.pt = this.wave.nativeElement.createSVGPoint();

    }

    get path() {
        return this.spectrum;
    }

    skip(e: MouseEvent) {
        if (this.isLoaded && this.pt) {
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
