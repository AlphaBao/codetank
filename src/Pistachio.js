// tianfangye.com
Jx().$package(function(J) {
  var Pistachio = function() {
    // 坦克
    var tank;

    // 坦克宽度、长度
    var tankX;
    var tankY;

    // 战场宽度、长度
    var fieldX;
    var fieldY;

    // 下一次到达的坐标
    var nextX;
    var nextY;

    // 安全距离：坦克中心到战场边缘
    var tankRange;

    // 安全距离：与战场边界的距离
    var edgeRange;

    this.initTank = function(robot) {
      tank = robot;

      tankX = tank.getSize()[0];
      tankY = tank.getSize()[1];

      fieldX = tank.getBattleFieldSize()[0];
      fieldY = tank.getBattleFieldSize()[1];

      tankRange = Math.max(tankX, tankY) / 2 + 5;
      edgeRange = Math.max(Math.min(fieldX, fieldY) / 10, tankRange * 4.5);
    }

    this.dist = Math.round(Math.random(47) * 200);

    this.infighting = false;

    this.smartTurn = function(angle) {
      if (angle > 180) {
        angle = angle - 360;
      } else if (angle < -180) {
        angle = angle + 360;
      }
      return angle;
    };

    this.angleToTurn = function(angleGunToTurn) {
      return this.smartTurn((angleGunToTurn + tank.getHeading() - tank.getGunHeading()) % 360);
    };

    this.fire = function(distance) {
      if (distance < 50) {
        this.infighting = true;
      }

      if (distance > 200 || tank.getEnergy() < 15) {
        tank.fire(1);
      } else if (distance > 50) {
        tank.fire(2);
      } else {
        tank.fire(3);
      }
    };

    // 随机移动，不撞墙
    this.smartMove = function() {
      var that = this;

      // 下次转动的角度 -360 ~ 360
      // tank.turn(nextDeg) 正数顺时针旋转，负数逆时针旋转
      var nextDeg = Math.ceil(Math.random(47) * 720) - 360;

      // 当前朝向
      // return 0 ~ 360
      var currentDeg = tank.getHeading();

      // 旋转后的朝向
      var deg = (currentDeg - nextDeg) % 360;
      var rad = Math.PI / 180 * deg;

      // 坦克当前坐标
      var posX = tank.getPos()[0];
      var posY = tank.getPos()[1];

      // 下次移动的距离
      var nextDistance = Math.random() * Math.max(fieldX, fieldY);

      // 偏移量
      var offsetX = tankX / 2 + Math.abs(nextDistance * Math.cos(rad));
      var offsetY = tankY / 2 + Math.abs(nextDistance * Math.sin(rad));

      // 正数角度，表示朝向
      var positiveDeg = deg < 0 ? deg + 360 : deg

      // 计算下一次到达的坐标 X
      if (positiveDeg < 90 || positiveDeg > 270) {
        nextX = posX + offsetX;
      } else {
        nextX = posX - offsetX;
      }

      // 计算下一次到达的坐标 Y
      if (positiveDeg < 180) {
        nextY = posY - offsetY;
      } else {
        nextY = posY + offsetY;
      }

      // debug
      this.heading = positiveDeg;
      this.posX = posX;
      this.posY = posY;
      this.nextX = nextX;
      this.nextY = nextY;
      this.nextDistance = nextDistance;

      // 检查坐标是否超出战场范围
      if (nextX >= tankRange && nextX < (fieldX - tankRange) &&
          nextY >= tankRange && nextY < (fieldY - tankRange)) {

        // 坦克在战场边缘时，走直线（避免撞墙）；否则，走弧线。
        if (nextX < edgeRange || nextX > (fieldX - edgeRange) || 
            nextY < edgeRange || nextY > (fieldY - edgeRange) || 
            posX < edgeRange || posX > (fieldX - edgeRange) || 
            posY < edgeRange || posY > (fieldY - edgeRange)) {

          // debug
          console.log("直线");

          // 先旋转，再走直线
          tank.turn(nextDeg, function() {
            tank.ahead(nextDistance);
          });
        } else {

          // debug
          console.log("弧线");

          // 同时旋转和移动，走弧线
          tank.setAhead(nextDistance);
          tank.setTurn(nextDeg);
          tank.execute();
        }
      } else {
        setTimeout(function() {
          that.smartMove();
        }, 0);
      }
    };
  };

  var po = new Pistachio();

  Robot = new J.Class({
    extend: tank.Robot
  }, {
    /*
    robot主函数
    */
    run: function() {
      po.initTank(this);
      this.setUI(tank.ui["red"]);
      this.say("大风起兮云飞扬……", "green");

      // debug
      // this.turnLeft(146 - this.getHeading());

      this.loop(function () {
        this.say("对酒当歌，人生几何？", "deepskyblue");
        po.smartMove();
      });
    },

    /*
    看到其他robot的处理程序
    */
    onScannedRobot: function(e) {
      var angleToTurn = po.angleToTurn(e.getBearing());

      if (Math.abs(angleToTurn) <= 3) {
        this.stopMove();
        this.turnGunLeft(angleToTurn);

        if (this.getGunHeat() === 0) {
          po.fire(e.getDistance());
        }
      } else {
        this.stopMove();
        this.turnGunLeft(angleToTurn);
      }

      this.scan();
      this.say("一剑霜寒十四州！", "red");
    },

    /**
    *被子弹击中的处理程序
    **/ 
    onHitByBullet:function(e){
      if (po.infighting) {
        po.infighting = false;
      } else {
        this.setAdjustGunForRobotTurn(true);
        this.setAhead(100);

        this.setTurn(60, function () {
          this.setTurn(-120, function () {
            this.setTurn(240, function () {
              this.setTurn(-120);
              this.execute();
            });
            this.execute();
          });
          this.execute();
        });
        this.execute();
        this.setAdjustGunForRobotTurn(false);
      }

      this.say("风萧萧兮易水寒！", "orange");
    },

    onHitRobot:function(e){
      var angle=e.getBearing()-(this.getGunHeading()-this.getHeading());
      this.turnGun(angle);
      this.fire(3);
      this.back(50);
      this.say("宜将剩勇追穷寇！", "blue")
    },

    onHitWall:function(e){

      // if(e.getBearing()<=90&&e.getBearing()>-90)
      //   this.back(40);
      // else
      //   this.ahead(40);
      this.say("悠然见南山……", "yellow")

      // debug
      console.log("heading: " + this.getHeading());
      console.log(po.nextX + " " + po.posX)
      console.log(po.nextY + " " + po.posY)
      console.log("nextDistance: " + po.nextDistance);
    },

    onWin:function(){
      this.say("十步杀一人，千里不留行。事了拂衣去，深藏身与名。", "red");
      this.turn(3600);
    }
  });
});
