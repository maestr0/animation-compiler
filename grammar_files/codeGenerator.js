$(function () {

        function range1(i) {
            return i > -1 ? range1(i - 1).concat(i) : []
        }

        function loadAnimationData(animationId, cb) {
            $.getJSON("http://sara.us-east-1.elasticbeanstalk.com/animations/" + animationId + "?callback=?", function (data) {
                cb(data);
            });
        }

        function reduceColors(array, color, tolerance) {
            var previousValue;
            return array.map(function (pixel, index, fullArray) {
                var value = pixel[color];

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
                x: range1(pixels.length - 1),
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
                x: range1(pixels.length - 1),
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
                x: range1(pixels.length - 1),
                y: pixels.map(function (data) {
                    return data[color];
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

        function reducedChartData(pixels) {
            return {
                r: createReducedDataPoints(pixels.r, 'red'),
                g: createReducedDataPoints(pixels.g, 'green'),
                b: createReducedDataPoints(pixels.b, 'blue')
            }
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
                r: rr,
                g: gr,
                b: br
            }

        }

        function toHex(integer) {
            return ("000000000000000" + integer.toString(16)).substr(-2);
        }

        function combinePixelsIntoHexStrings(r, g, b) {
            return toHex(r) + toHex(g) + toHex(b);
        }

        function rampAnimation(animationData, transitions, cb) {
            for (var pixelIndex = 0; pixelIndex < animationData.animation.length; pixelIndex++) {
                var pixelFrame = animationData.animation[pixelIndex];
                var pixelFrameSeparatedColors = extractPixels(pixelFrame);
                var pixelFrameSeparatedColorsReduced = reduceData(pixelFrameSeparatedColors, transitions);
                var combinedFrames = [];
                for (var frameIndex = 0; frameIndex < pixelFrameSeparatedColorsReduced.r.length; frameIndex++) {
                    var hexColor = combinePixelsIntoHexStrings(pixelFrameSeparatedColorsReduced.r[frameIndex],
                        pixelFrameSeparatedColorsReduced.g[frameIndex],
                        pixelFrameSeparatedColorsReduced.b[frameIndex]);
                    pixelFrame.transitions[frameIndex].start = hexColor;
                    pixelFrame.transitions[frameIndex].end = hexColor;
                    // combinedFrames.push(hexColor);
                }
            }

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
                var red = parseInt(a.start.substring(0, 2), 16);
                var green = parseInt(a.start.substring(2, 4), 16);
                var blue = parseInt(a.start.substring(4), 16);
                return {red: red, green: green, blue: blue};
            });
        }

        function generateAnimationCode(allPixels, transitions) {
            var pixelsInRGB = allPixels.animation.map(function (pixel) {
                var ep = extractPixels(pixel);
                var rd2 = reducedChartData(reduceData(ep, transitions));
                return {
                    blue: rd2.b.y,
                    green: rd2.g.y,
                    red: rd2.r.y
                };
            });

            var pixelPosition = $("#pixel").val();
            var code = "***** BEGIN *****\n";
            pixelsInRGB.map(function (pixel, index, fullArray) {
                if (pixelPosition == index) {
                    code += "\nMODULE " + index + "\n";
                    var previousValue = pixel.red[0];
                    var count = 0;
                    code += "\nRAMP " + pixel.red[0];
                    pixel.red.map(function (px, index) {
                        if (previousValue != px) {
                            code += " duration " + count + "\nRAMP " + px;
                            count = 0;
                        } else {
                            // code += " duration " + count + "\n";
                            count++;
                        }
                        previousValue = px;
                    });

                    code += " duration " + count;
                }
            });
            $("#code").text(code);
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
                var reduced = reducedChartData(reduceData(pixels, transitions));
                //dataPoints.g, reduced.g, dataPoints.b, reduced.b
                var data = [dataPoints.r, reduced.r];
                Plotly.newPlot('myDiv', data, layout);
            });
        });

        var playerOriginal = new SaraPlayer({
            wrapperClass: ".previewOriginal"
        });

        var playerRamped = new SaraPlayer({
            wrapperClass: ".previewRamped"
        });

        $("#play").click(function () {
            var animationId = $("#animationDropdown").val();
            loadAnimationData(animationId, function (animationData) {
                playerOriginal.startAnimation(animationData);
            });
        });

        $("#generateCode").click(function () {
            var transitions = $("#maxTransitions").val();
            var animationId = $("#animationDropdown").val();
            loadAnimationData(animationId, function (animationData) {
                generateAnimationCode(animationData, transitions);

            });
        });

        $("#playRamps").click(function () {
            var animationId = $("#animationDropdown").val();
            var transitions = $("#maxTransitions").val();
            loadAnimationData(animationId, function (animationData) {
                var clonedOriginalAni = jQuery.extend(true, {}, animationData);
                var rampedAnimation = rampAnimation(animationData, transitions);

                playerOriginal.startAnimation(clonedOriginalAni);
                playerRamped.startAnimation(rampedAnimation);
            });
        });

        $("#plot").click();
    }
);