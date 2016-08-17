$(function () {

        function range1(i) {
            return i ? range1(i - 1).concat(i) : []
        }

        function loadAnimationData(animationId, cb) {
            $.getJSON("http://sara.us-east-1.elasticbeanstalk.com/animations/" + animationId + "?callback=?", function (data) {
                cb(data);
            });
        }

        function reduceColors(array, color, tolerance) {
            var previousValue;
            return array.map(function (pixel, index, fullArray) {
                var value = parseInt(pixel[color], 16);

                if (index > 0) {
                    if (Math.abs(previousValue - value) < tolerance) {
                        value = previousValue;
                        // fullArray[index] = 100;
                    } else {
                        previousValue = value;
                    }

                } else {
                    previousValue = value;
                }

                return value;
            });
        }

        function countChannelChanges(data) {
            var changes = 0;
            var flat = false;
            var previousValue = data.y[0];
            data.y.map(function (value) {
                if (value != previousValue) {
                    changes++;
                    previousValue = value;
                    flat = false;
                } else {
                    if (!flat) {
                        changes++;
                    }
                    flat = true;
                }
            });

            return changes;
        }

        function createReducedDataPoints(pixels, color, tolerance) {
            return {
                x: range1(pixels.length),
                y: reduceColors(pixels, color, tolerance),
                mode: 'lines+markers',
                name: color + ' ramps',
                type: 'scatter',
                line: {
                    color: color,
                    width: 5
                }
            }
        }

        function createDataPoints(pixels, color) {
            return {
                x: range1(pixels.length),
                y: pixels.map(function (data) {
                    return parseInt(data[color], 16);
                }),
                mode: 'lines+markers',
                name: color,
                type: 'scatter',
                line: {
                    shape: 'hv',
                    color: color,
                    width: 1
                }
            };
        }

        function reduceData(pixels, maxTransitionNo) {

            for (var i = 0; i < 255; i++) {
                var gr = createReducedDataPoints(pixels, 'green', i);
                var br = createReducedDataPoints(pixels, 'blue', i);
                var rr = createReducedDataPoints(pixels, 'red', i);
                if (countChannelChanges(rr) + countChannelChanges(br) + countChannelChanges(gr) < maxTransitionNo) {
                    break;
                }
            }


            console.log("rr " + countChannelChanges(rr));
            console.log("br " + countChannelChanges(br));
            console.log("gr " + countChannelChanges(gr));

            return {
                r: rr,
                g: gr,
                b: br
            }

        }

        function rampAnimation(animationData, cb) {
            // TODO
            return animationData;
        }

        function dataSet(pixels) {
            var g = createDataPoints(pixels, 'green');
            var b = createDataPoints(pixels, 'blue');
            var r = createDataPoints(pixels, 'red');
            return {
                r: r,
                g: g,
                b: b
            }
        }

        var layout = {
            legend: {
                y: 0.5,
                traceorder: 'reversed',
                font: {size: 16},
                yref: 'paper'
            }
        };

        function extractPixels(animation, pixelIndex) {
            return animation.animation[pixelIndex].transitions.map(function (a) {
                var red = a.start.substring(0, 2);
                var green = a.start.substring(2, 4);
                var blue = a.start.substring(4);
                return {red: red, green: green, blue: blue};
            });
        }

        $("#plot").click(function () {
            var trans = $("#maxTransitions").val();
            var px = $("#pixel").val();
            var animationId = $("#animationDropdown").val();
            loadAnimationData(animationId, function (animationData) {
                var pixels = extractPixels(animationData, px);
                var dataPoints = dataSet(pixels);
                var reduced = reduceData(pixels, trans);
                var data = [dataPoints.g, reduced.g, dataPoints.b, reduced.b, dataPoints.r, reduced.r];
                Plotly.newPlot('myDiv', data, layout);
            });
        });

        var player = new SaraPlayer({
            wrapperClass: ".preview"
        });

        $("#play").click(function () {
            var animationId = $("#animationDropdown").val();
            loadAnimationData(animationId, function (animationData) {
                player.startAnimation(animationData);
            });
        });

        $("#playRamps").click(function () {
            var animationId = $("#animationDropdown").val();
            loadAnimationData(animationId, function (animationData) {
                rampAnimation(animationData, function (d) {
                    player.startAnimation(d);
                });
            });
        });

    }
);