$(function () {

    function range1(i) {
        return i ? range1(i - 1).concat(i) : []
    }

    var tolerance = 20;

    function reduceColors(array, color) {
        var previousValue;
        return array.map(function (pixel, index, fullArray) {
            var value = parseInt(pixel[color], 16);

            if (index > 0) {
                // var previousValue = parseInt(fullArray[index - 1][color], 16);
                console.log('prev value = ' + previousValue);

                if (Math.abs(previousValue - value) < tolerance) {
                    value = previousValue;
                    // fullArray[index] = 100;
                } else {
                    previousValue = value;
                }

            }else {
                previousValue = value;
            }

            return value;
        });
    }

    console.log('generator started');
    var pixels = sampleAnimation.animation[380].transitions.map(function (a) {
        var red = a.start.substring(0, 2);
        var green = a.start.substring(2, 4);
        var blue = a.start.substring(4);
        return {red: red, green: green, blue: blue};
    });


    console.log(pixels);


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

    var greenReducedData = {
        x: range1(pixels.length),
        y: reduceColors(pixels, 'green'),
        mode: 'lines+markers',
        name: 'green ramps',
        type: 'scatter',
        line: {
            color: 'green',
            width: 5
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


    var data = [greenData, greenReducedData];

    var layout = {
        legend: {
            y: 0.5,
            traceorder: 'reversed',
            font: {size: 16},
            yref: 'paper'
        }
    };

    Plotly.newPlot('myDiv', data, layout);


});