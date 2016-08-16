$(function () {

        function range1(i) {
            return i ? range1(i - 1).concat(i) : []
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

        var pixels = sampleAnimation.animation[320].transitions.map(function (a) {
            var red = a.start.substring(0, 2);
            var green = a.start.substring(2, 4);
            var blue = a.start.substring(4);
            return {red: red, green: green, blue: blue};
        });

        var redData = {
            x: range1(pixels.length),
            y: pixels.map(function (data) {
                return parseInt(data.red, 16);
            }),
            mode: 'lines+markers',
            name: 'red',
            type: 'scatter',
            line: {
                color: 'red',
                width: 1,
                shape: 'hv'
            }
        };

        var greenData = {
            x: range1(pixels.length),
            y: pixels.map(function (data) {
                return parseInt(data.green, 16);
            }),
            mode: 'lines+markers',
            name: 'green',
            type: 'scatter',
            line: {
                shape: 'hv',
                color: 'green',
                width: 1
            }
        };


        var blueData = {
            x: range1(pixels.length),
            y: pixels.map(function (data) {
                return parseInt(data.blue, 16);
            }),
            mode: 'lines+markers',
            name: 'blue',
            type: 'scatter',
            line: {
                shape: 'hv',
                color: 'blue',
                width: 1
            }
        };

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

        var d = reduceData(pixels, 25);

        var data = [greenData, d.g, blueData, d.b, redData, d.r];


        var layout = {
            legend: {
                y: 0.5,
                traceorder: 'reversed',
                font: {size: 16},
                yref: 'paper'
            }
        };

        Plotly.newPlot('myDiv', data, layout);


    }
);