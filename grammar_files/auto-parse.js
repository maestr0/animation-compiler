$(document).ready(function () {
    var KB = 1024;
    var MS_IN_S = 1000;

    var parser;

    var buildAndParseTimer = null;
    var parseTimer = null;

    var oldGrammar = null;
    var oldParserVar = null;
    var oldOptionCache = null;
    var oldOptionOptimize = null;
    var oldInput = null;

    function buildSizeAndTimeInfoHtml(title, size, time) {
        return $("<span/>", {
            "class": "size-and-time",
            title: title,
            html: (size / KB).toPrecision(2) + "&nbsp;kB, "
            + time + "&nbsp;ms, "
            + ((size / KB) / (time / MS_IN_S)).toPrecision(2) + "&nbsp;kB/s"
        });
    }

    function buildErrorMessage(e) {
        return e.line !== undefined && e.column !== undefined
            ? "Line " + e.line + ", column " + e.column + ": " + e.message
            : e.message;
    }


    function parse() {
        oldInput = $("#input").val();


        $("#input").removeAttr("disabled");
        $("#parse-message").attr("class", "messageProgress").text("Compiling your code...");
        $("#output").addClass("disabled").text("Output not available yet.");

        try {
            var timeBefore = (new Date).getTime();
            var output = ledGrammar.parse($("#input").val());
            var timeAfter = (new Date).getTime();

            $("#parse-message")
                .attr("class", "message info")
                .text("Code compiled successfully.")
                .append(buildSizeAndTimeInfoHtml(
                    "Parsing time and speed",
                    $("#input").val().length,
                    timeAfter - timeBefore
                ));


            //$("#output").removeClass("disabled").text(jsDump.parse(output));

            var compiledCode = JSON.stringify(output);
            console.log(compiledCode);

            compiledCode = JSON.parse(compiledCode);
            compiledCode = compiledCode[0][3];

            $("#output").removeClass("disabled").text(formatCompiledCode(compiledCode));

            var result = true;
        } catch (e) {
            if ($("#input").val().length === 0) result = true;       //if we don't have any code yet, consider it's ok and not an error, otherwise error

            else {
                $("#parse-message").attr("class", "messageError").text(buildErrorMessage(e));
                var result = false;

            }
        }

        return result;
    }

    function formatCompiledCode(codeAsString) {
        var compiledProgram = codeAsString.compiledProgram;
        var enginesProgram = codeAsString.enginesProgram;
        var formatedCode = "{\n";

        compiledProgram.forEach(function (currentInstruction, index, thisArray) {
            formatedCode += '   0x' + currentInstruction.code;
            if (index == thisArray.length - 1) formatedCode += '\n';
            else formatedCode += ',\n';
        });
        formatedCode += "}\n";
        enginesProgram.forEach(function (currentSegment, index, thisArray) {
            formatedCode += '   0x' + currentSegment.position.toString(16);
            if (index == thisArray.length - 1) formatedCode += '\n';
            else formatedCode += ',\n';
        });
        return formatedCode;
    }

    //----------------------------------------------
    function scheduleParse() {
        if ($("#input").val() === oldInput) {
            return;
        }
        //if (buildAndParseTimer !== null) { return; }

        if (parseTimer !== null) {
            clearTimeout(parseTimer);
            parseTimer = null;
        }

        parseTimer = setTimeout(function () {
            parse();
            parseTimer = null;
        }, 500);
    }


    $("#input")
        .change(scheduleParse)
        .mousedown(scheduleParse)
        /*.mouseup(scheduleParse)*/
        .click(scheduleParse)
        .keydown(scheduleParse)
        /*.keyup(scheduleParse)*/
        .keypress(scheduleParse);


    $("#content").show();


    parse();
});
