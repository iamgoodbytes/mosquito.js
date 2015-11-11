// articles that helped me get started with html5 audio and generating the frequency spectrum are the following:
// part of the code below has been inspired by the articles linked below
//
// this project is not intended to be a best-practice of any sort,
// it's just a fun little project I put together to play around with the audio api's
//
// SOURCES:
// http://www.smartjava.org/content/exploring-html5-web-audio-visualizing-sound
// http://blog.loadimpact.com/web-development/webaudio_explained/

/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * https://www.twitter.com/goodbytes wrote this file.  As long as you retain
 * this notice you can do whatever you want with this stuff. If we meet some
 * day, and you think this stuff is worth it, you can buy me a beer in return.
 * ----------------------------------------------------------------------------
 */

// detect support for different browsers
navigator.getUserMedia = (navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia);

// some global vars I should clean up
var javascriptNode; // prevent from falling asleep, must be a chrome bug?
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var analyser;
var counter;
var peaks = [];
var peakDetectionTimer;
var MAX_VOLUME_ALLOWED = 30; // max average volume to tolerate

var intendedWidth = document.querySelector('body').clientWidth;
canvas.setAttribute('width',intendedWidth);

var WIDTH = document.getElementById("canvas").width;
var HEIGHT = document.getElementById("canvas").height;

var Mosquito = {

	setup : function(){
		// ask permission to grab the mic
		var stream = navigator.getUserMedia({ audio: true }, Mosquito.successCallback, Mosquito.errorCallback);
	},

	successCallback : function(localMediaStream){
		var audioContext = new AudioContext();

		// hook up the mic to the mediaStreamSource in audioContext
		var microphone = audioContext.createMediaStreamSource( localMediaStream );
		Mosquito.processAudio(microphone, audioContext);
	},

	processAudio : function(microphone, audioContext){
		// analyze a piece of the signal
		analyser = audioContext.createAnalyser();
		analyser.smoothingTimeConstant = 0.6; // make it less jizzy
		analyser.fftSize = 2048;
        analyser.maxDecibels = -10;
        analyser.minDecibels = -100;

		// create a scriptProcessor in order to read out the analyser data
		javascriptNode = audioContext.createScriptProcessor(1024, 1, 1);

		// connect all the things
		microphone.connect(analyser);
		analyser.connect(javascriptNode);
		javascriptNode.connect(audioContext.destination);


		javascriptNode.onaudioprocess = function(e){
			var array =  new Uint8Array(analyser.frequencyBinCount);
			analyser.getByteFrequencyData(array);

			var average = Mosquito.getAverageVolume(array);
            Mosquito.detectPeak(average);
            Mosquito.drawSpectrum(array);
            document.getElementById("meter").innerHTML = average;
		};
	},

    detectPeak : function(average)
    {
        if(peakDetectionTimer == null)
        {
          // detect peaks every x seconds
          peakDetectionTimer = setTimeout(function(){
                console.log("timer!");

                peaks.unshift(average);
                if(peaks.length == 11)
                {
                    // remove element at key 10, remove 1 element
                    peaks.splice(10, 1);
                    var avg = Mosquito.getAverageVolume(peaks);
                    console.log(avg);
                    if(avg > MAX_VOLUME_ALLOWED)
                    {
                      Mosquito.showSilencer();
                    }
                    else
                    {
                      Mosquito.hideSilencer();
                    }
                }

                peakDetectionTimer = null; // restart the timer
          }, 1000);
        }
    },

    drawSpectrum : function(array)
    {
        var gradient = ctx.createLinearGradient(0,0,0,HEIGHT);
        gradient.addColorStop(0,'#ff0000');
        gradient.addColorStop(1,'#ffff00');
        ctx.fillStyle=gradient;
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        var bufferSize = array.length;
        var barWidth = WIDTH/bufferSize*1.5;

        for ( var i = 0; i < (array.length); i++ ){
            var value = array[i];
            var barHeight = value;
            var whatsLeft = HEIGHT-barHeight;
            ctx.fillRect(i*barWidth+1,HEIGHT-barHeight,barWidth,barHeight );
        }
    },

    getAverageVolume : function(array){
		var values = 0;
        var average;

        var length = array.length;

        // get all the frequency amplitudes
        for (var i = 0; i < length; i++) {
            values += array[i];
        }

        average = values / length;
        return average;
	},

  showSilencer : function(){
      // show a silencer message or image
      document.getElementById("silence").setAttribute("class", "fadeIn");
      document.getElementById("soundSilence").play();
  },

  hideSilencer : function(){
      // show a silencer message or image
      document.getElementById("silence").setAttribute("class", "");
      var audio = document.getElementById("soundSilence");
      audio.pause();
      audio.currentTime = 0;
  },

	errorCallback : function(){
		console.log('Shit has hit the audio fan!');
	}
}

Mosquito.setup();
