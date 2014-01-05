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

    // 战斗状态标识
    this.infighting = false;

    // 初始化参数
    this.initTank = function(robot) {
      tank = robot;

      tankX = tank.getSize()[0];
      tankY = tank.getSize()[1];

      fieldX = tank.getBattleFieldSize()[0];
      fieldY = tank.getBattleFieldSize()[1];

      tankRange = Math.max(tankX, tankY) / 2 + 5;
      edgeRange = Math.max(Math.min(fieldX, fieldY) / 10, tankRange * 4.5);
    }

    // 工具方法，处理火炮旋转角度
    this.angleToTurn = function(angleGunToTurn) {
      var angle = (angleGunToTurn + tank.getHeading() - tank.getGunHeading()) % 360;

      if (angle > 180) {
        angle = angle - 360;
      } else if (angle < -180) {
        angle = angle + 360;
      }

      return angle;      
    };

    // 处理坦克开炮
    this.fire = function(distance, angleToTurn) {
      this.infighting = true;

      // If it's close enough, fire!
      if (Math.abs(angleToTurn) <= 3) {
        tank.stopMove();
        tank.turnGunLeft(angleToTurn);

        // We check gun heat here, because calling fire()
        // uses a turn, which could cause us to lose track
        // of the other robot.
        if (tank.getGunHeat() === 0) {
          tank.fire( Math.min(3 - Math.abs(angleToTurn), tank.getEnergy() - 0.1) );
        }
      } else {
        tank.stopMove();
        tank.turnGunLeft(angleToTurn);
      }
    };

    // 智能移动
    this.smartMove = function() {
      var that = this;

      if (this.infighting) {
        tank.turnGunLeft(50, function() {
          tank.turnGunLeft(-100);
        });
      } else {
        this.infighting = false;
      }

      // 下次转动的角度 -360 ~ 360
      // tank.turn(nextDeg) 正数顺时针旋转，负数逆时针旋转
      var nextDeg = Math.ceil(Math.random(47) * 720) - 360;
      
      // 停止移动
      tank.stopMove();

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
      // this.heading = positiveDeg;
      // this.posX = posX;
      // this.posY = posY;
      // this.nextX = nextX;
      // this.nextY = nextY;
      // this.nextDistance = nextDistance;

      // 检查坐标是否超出战场范围
      if (nextX >= tankRange && nextX < (fieldX - tankRange) &&
          nextY >= tankRange && nextY < (fieldY - tankRange)) {


        // 坦克在战场边缘时，走直线（避免撞墙）；否则，走弧线。
        if (nextX < edgeRange || nextX > (fieldX - edgeRange) || 
            nextY < edgeRange || nextY > (fieldY - edgeRange) || 
            posX < edgeRange || posX > (fieldX - edgeRange) || 
            posY < edgeRange || posY > (fieldY - edgeRange)) {

          // 炮筒与雷达跟随坦克的旋转
          tank.setAdjustGunForRobotTurn(false);
          tank.setAdjustRadarForRobotTurn(false);

          // 先旋转，再走直线
          tank.turn(nextDeg, function() {
            tank.ahead(nextDistance);
          });
        } else {

          // 炮筒与雷达独立于坦克的旋转
          tank.setAdjustGunForRobotTurn(true);
          tank.setAdjustRadarForRobotTurn(true);

          // 同时旋转和移动，走弧线
          tank.setAhead(nextDistance);
          tank.setTurn(nextDeg);
          tank.setGunTurn( Math.round(Math.random(47) === 1 ? 360 : -360) );
          tank.execute();
        }
      } else {

        // 坐标超出安全范围，重新处理
        this.smartMove();
      }
    };
  };

  var po = new Pistachio();

  Robot = new J.Class({
    extend: tank.Robot
  }, {

    // 坦克的运动入口方法，该方法启动坦克的运动
    run: function() {

      // 用this传入扩展后的tank.Robot
      po.initTank(this);
      this.setUI(tank.ui["red"]);
      this.say("大风起兮云飞扬……", "green");

      // 让运动循环执行
      this.loop(function () {
        this.say("对酒当歌，人生几何？", "deepskyblue");
        po.smartMove();
      });
    },

    // 发现其他坦克
    onScannedRobot: function(e) {
      var angleToTurn = po.angleToTurn(e.getBearing());

      this.say("一剑霜寒十四州！", "red");
      this.stopMove();
      this.turnGunLeft(angleToTurn);

      if (Math.abs(angleToTurn) <= 3) {
        if (this.getGunHeat() === 0) {
          po.fire(e.getDistance(), angleToTurn);
        }
      }

      this.scan();
    },

    // 被子弹击中
    onHitByBullet:function(e){

      if (po.infighting) {
        po.infighting = false;
        this.stopMove();
        this.scan();
      } else {
        po.smartMove();
      }

      this.say("风萧萧兮易水寒！", "orange");
    },

    // 与其他坦克碰撞
    onHitRobot:function(e){
      var angle=e.getBearing()-(this.getGunHeading()-this.getHeading());
      this.turnGun(angle);
      this.fire(3);
      this.back(50);
      this.say("宜将剩勇追穷寇！", "blue");
    },

    // 撞墙
    onHitWall:function(e){
      po.smartMove();
      this.say("悠然见南山……", "yellow");

      // debug
      // console.log("heading: " + this.getHeading());
      // console.log(po.nextX + " " + po.posX);
      // console.log(po.nextY + " " + po.posY);
      // console.log("nextDistance: " + po.nextDistance);
    },

    // 战斗胜利
    onWin:function(){
      this.say("十步杀一人，千里不留行。事了拂衣去，深藏身与名。", "red");
      this.turn(3600);
    }
  });
});
