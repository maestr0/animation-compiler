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
            var previousValue = data[0];
            data.map(function (value) {
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

        function createReducedDataPoints(pixels, color) {
            return {
                x: range1(pixels.length),
                y: pixels,
                mode: 'lines+markers',
                name: color + ' ramps',
                type: 'scatter',
                line: {
                    color: color,
                    width: 5
                }
            }
        }

        function createDotsDataPoints(pixels, color) {
            return {
                x: range1(pixels.length),
                y: pixels,
                mode: 'markers',
                name: color + ' Ramps as FRAMES',
                type: 'scatter',
                line: {
                    color: 'black',
                    width: 15
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
                var gr = reduceColors(pixels, 'green', i);
                var br = reduceColors(pixels, 'blue', i);
                var rr = reduceColors(pixels, 'red', i);

                var tr = countChannelChanges(rr);
                var tb = countChannelChanges(br);
                var tg = countChannelChanges(gr);
                var transitionsSum = tr + tb + tg;
                if (transitionsSum < maxTransitionNo) {
                    $("#tolerance span").text(i);
                    $("#transitions span").text(transitionsSum + " r=" + tr + " g=" + tg + " b=" + tb);
                    break;
                }
            }

            return {
                r: createReducedDataPoints(rr, 'red'),
                g: createReducedDataPoints(gr, 'green'),
                b: createReducedDataPoints(br, 'blue')
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

        function extractPixelsFromAnimation(animation, pixelIndex) {
            return extractPixels(animation.animation[pixelIndex]);
        }

        function extractPixels(pixels) {
            return pixels.transitions.map(function (a) {
                var red = a.start.substring(0, 2);
                var green = a.start.substring(2, 4);
                var blue = a.start.substring(4);
                return {red: red, green: green, blue: blue};
            });
        }

        function generateAnimationCode(allPixels, transitions) {
            var pixelsInRGB = allPixels.animation.map(function (pixel) {
                var ep = extractPixels(pixel);
                var rd2 = reduceData(ep, transitions);
                return {
                    blue: rd2.b.y,
                    green: rd2.g.y,
                    red: rd2.r.y
                };
            });

            var code = "***** BEGIN *****\n";
            pixelsInRGB.map(function (pixel, index, fullArray) {
                code += "\nMODULE " + index + "\n";
                var previousValue = -1;
                var count = 0;
                $.each(pixel.red, function (index) {
                    if (previousValue.toString() != this.toString()) {
                        if (count == 0) {
                            code += "RAMP " + this;
                            count++;
                        } else {
                            code += " duration " + count + "\n";
                            code += "RAMP " + this;
                            count = 0;
                        }

                    } else {
                        count++;
                    }
                    previousValue = this;
                });
            });
            console.log(code);
        }

        function convertReducedIntoFullFrames(r) {
            var reduced = r.r.y.slice(0);
            return {r: createDotsDataPoints(reduced, r.r.line.color)};

        }

        $("#nextPixel").click(function () {
            var pixelPosition = $("#pixel").val();
            $("#pixel").val(++pixelPosition);
            $("#plot").click();
        });

        $("#prevPixel").click(function () {
            var pixelPosition = $("#pixel").val();
            $("#pixel").val(--pixelPosition);
            $("#plot").click();
        });

        $("#plot").click(function () {
            var transitions = $("#maxTransitions").val();
            var pixelPosition = $("#pixel").val();
            var animationId = $("#animationDropdown").val();
            loadAnimationData(animationId, function (animationData) {
                var pixels = extractPixelsFromAnimation(animationData, pixelPosition);
                var dataPoints = dataSet(pixels);
                var reduced = reduceData(pixels, transitions);
                var reducedConvertedIntoFrames = convertReducedIntoFullFrames(reduced);
                // dataPoints.g, reduced.g, dataPoints.b, reduced.b,
                var data = [dataPoints.r, reduced.r, reducedConvertedIntoFrames.r];
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

        $("#generateCode").click(function () {
            var transitions = $("#maxTransitions").val();
            var animationId = $("#animationDropdown").val();
            loadAnimationData(animationId, function (animationData) {
                setTimeout(function () {
                    generateAnimationCode(animationData, transitions);
                }, 0);

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