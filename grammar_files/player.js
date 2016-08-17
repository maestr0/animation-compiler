function SaraPlayer(options) {
    this.settings = {
        idleModuleColor: "white",
        wrapperClass: ".canvasWrapper",
        stopButton: "",
        playButton: "",
        width: 1000,
        height: 150,
        useBackgroundImage: false
    };

    this.settings = $.extend({}, this.settings, options);
    this.stage = null;
    this.modules = [];
    this.animationStepTimeouts = [];
    this.lastPlayedAnimation = [];

    this.init = function () {
        this.buildCanvas();
        this.initModules();
    };

    this.buildCanvas = function () {
        var canvasRandomId = Math.random().toString(36).substring(7);
        $("<canvas>", {
            "class": this.settings.playerName,
            id: canvasRandomId
        }).attr("width", this.settings.width)
            .attr("height", this.settings.height)
            .appendTo(this.settings.wrapperClass);

        var that = this;
        this.stage = new createjs.Stage(canvasRandomId);
        this.stage.enableMouseOver();
        if (this.settings.useBackgroundImage) {
            var img = new Image();
            img.src = "/images/background-day-strong_crop.jpg2";
            var bitmap = new createjs.Bitmap(img);
            img.onload = function () {
                bitmap.scaleX = 1000 / event.srcElement.width;
                bitmap.scaleY = 150 / event.srcElement.height;
                that.stage.update();
            };
            this.stage.addChild(bitmap);
        }
    };

    this.initModules = function () {
        var horizontalSpacer = 0;
        var verticalSpacer = 0;
        var moduleId = 0;
        var shift = 0;
        var that = this;

        for (var y = 0; y < 6; y++) {
            if (y != 0 && y % 2 == 0) horizontalSpacer++;
            for (var x = 0; x < 70; x++) {
                if (x != 0 && x % 7 == 0) verticalSpacer++;

                if (x % 2 != 0) shift = -5;
                else shift = 5;

                var circle = new createjs.Shape();
                var circle_x = 12.85 * x + verticalSpacer * 10;
                var circle_y = 20 * y + horizontalSpacer * 10 + shift;

                circle.graphics.clear().beginFill(this.settings.idleModuleColor).drawCircle(circle_x, circle_y, 2);
                circle.x = 10;
                circle.y = 10;
                moduleId++;

                this.modules.push(circle);

                this.stage.addChild(circle);
            }
            verticalSpacer = 0;
        }
        this.stage.update();

        $(this.settings.stopButton).click(function () {
            that.stop();
        });
    };

    this.playAnimation = function (animationId) {
        this.resetModules();
        var that = this;
        $.get("/animations/" + animationId, function (data) {
            that.startAnimation(data);
        });
    };

    this.resetModules = function () {
        for (var i = 0; i < this.modules.length; i++) {
            var m = this.modules[i];
            var x2 = m.graphics.command.x;
            var y2 = m.graphics.command.y;
            m.graphics.clear().beginFill(this.settings.idleModuleColor)
                .drawCircle(x2, y2, 2);
        }
        this.stage.update();
    };

    this.replay = function () {
        this.startAnimation(this.lastPlayedAnimation);
    };

    this.stop = function () {
        for (var i = 0; i < this.animationStepTimeouts.length; i++) {
            clearTimeout(parseInt(this.animationStepTimeouts[i]));
        }
        this.animationStepTimeouts = [];
        this.resetModules();
    };

    this.playFrame = function (animationFrames, frames, frameIndex) {
        var that = this;
        return function () {
            var frameDuration = that.animationFrames[0].transitions[frameIndex].duration;

            for (var i = 0; i < that.modules.length; i++) {
                var color = "#" + that.animationFrames[i].transitions[frameIndex].start;
                var m = that.modules[i];
                var x2 = m.graphics.command.x;
                var y2 = m.graphics.command.y;
                m.graphics
                    .beginFill(color)
                    .drawCircle(x2, y2, 3);
            }
            that.stage.update();

            frameIndex++;
            if (frameIndex < frames) {

                var nextFrameTimeout = setTimeout(that.playFrame(animationFrames, frames, frameIndex), frameDuration);
                that.animationStepTimeouts.push(nextFrameTimeout);
            }
        }
    };

    this.startAnimation = function (aniData) {
        this.lastPlayedAnimation = aniData;
        this.animationStepTimeouts = [];
        var that = this;
        var length = aniData.duration / aniData.frames;
        var frames = aniData.frames;
        this.animationFrames = aniData.animation;

        $(this.settings.playButton).attr("disabled", "disabled");

        this.playFrame(this.animationFrames, frames, 0)();

        var removeDisabledTimeout = setTimeout(function () {
            $(that.settings.playButton).removeAttr("disabled");
        }, parseInt(aniData.duration) + 500);

        this.animationStepTimeouts.push(removeDisabledTimeout);

        var resetTimeout = setTimeout(function () {
            that.resetModules();
        }, aniData.duration);
        this.animationStepTimeouts.push(resetTimeout);
    };

    this.init();

}