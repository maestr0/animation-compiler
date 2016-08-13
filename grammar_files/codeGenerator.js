$(function () {
    console.log('generator started');
    var pixels = sampleAnimation.animation[200].transitions.map(function (a) {
        var red = a.start.substring(0, 2);
        var green = a.start.substring(2, 4);
        var blue = a.start.substring(4);
        return {red: red, green: green, blue: blue};
    });


    console.log(pixels);


    var redData = {
        x: [1, 2, 3, 4, 5],
        y: [26, 28, 27, 28, 26],
        mode: 'lines+markers',
        name: 'hv',
        line: {shape: 'hv'},
        type: 'scatter',
        line: {
            color: 'red',
            width: 1
        }
    };

    var data = [redData];

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