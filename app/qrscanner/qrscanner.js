/**
 * Copyright (c) 2015 Ambisafe Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including the rights to use, copy, modify,
 * merge, publish, distribute, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * @file qrscanner.js
 * @author Charlie Fontana <charlie@ambisafe.co>
 * @date 07/20/2015
 */

/**
 * This section defines the required libraries
 */
var qrcode = require('./qrcode.js');

/**
 * Defines the QRScanner constructor.
 */
var QRScanner = function () {

};

QRScanner.scanQR = function(divID, success, error) {
	var div, height, width, video, canvas, context, check, play;

	if (typeof window === 'undefined') {
		error('window is not defined');
		return;
	}

	if (typeof navigator === 'undefined') {
		error('navigator is not defined');
		return;
	}

	div = document.getElementById(divID);

	if (!div) {
		error(divID + ' is not defined');
		return;
	}

	height = div.offsetHeight;
	height = height?height:250;

	width = div.offsetWidth;
	width = width?width:300;

	div.innerHTML += '<video id="readerqr-html5-video" width="' + width + 'px" height="' + height + 'px"></video>';
	div.innerHTML += '<canvas id="qr-scanner-qr-canvas" width="' + (width - 2) + 'px" height="' + (height - 2) + 
					 'px" style="display:none;"></canvas>';

	video = document.getElementById('readerqr-html5-video');
	canvas = document.getElementById('qr-scanner-qr-canvas');
	context = canvas.getContext('2d');

	check = function() {
		if (localMediaStream) {
			context.drawImage(video, 0, 0, 307, 250);

			try {
				qrcode.decode();
			} catch (err) {
				error(err);
			}
		}

		if (!video.paused) {
			setTimeout(check, 500);
		}
	};

	window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
	
	play = function(value) {
		video.src = window.URL && window.URL.createObjectURL(value) || value;
		localMediaStream = value;
		video.play();

		if (!video.paused) {
			setTimeout(check, 1E3);
		}
	};

	if (navigator.getUserMedia) {
		navigator.getUserMedia({video: !0}, play, function(err) {
			if (err.message) {
				div.innerHTML = err.message;
				error(err.message);
			} else {
				error(err);
			}
		});
	} else {
		div.innerHTML = 'Native web camera streaming (getUserMedia) not supported in this browser';
		error(div.innerHTML);
	}

	qrcode.callback = function(data) {
		video.pause();
		success(data);
	};
};

/**
 * exports the created QRScanner object.
 */
module.exports = QRScanner;