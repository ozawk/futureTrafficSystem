import { NearScanner } from "@toio/scanner";

const sections = {
    //セクション番号: {
    // セクション範囲左上座標:
    // セクション範囲右上座標:
    // セクション範囲左下座標:
    // セクション範囲右下座標:
    // 車走行方向: (UP, RIGHTUP, RIGHT, RIGHTDOWN, DOWN, DOWNLEFT, LEFT, LEFTUP ),
    // 車走行線の中心座標: (直進:X OR Y, 斜めに:セクション開始座標)
    // 車走行線の距離:
    // (長辺を採用する. 線がX:0,Y:10であれば10. 線がX:5,Y:10であれば11.2)
    // NOTE オーバーシュート対策で浅く曲がる関係でθ=45°じゃないから注意

    0: {
        LU: { x: 390, y: 787 },
        RU: { x: 459, y: 787 },
        LD: { x: 390, y: 863 },
        RD: { x: 459, y: 863 },
        direction: "UP",
        center: { x: 425, y: NaN },
        distance: 76,
    },
    1: {
        LU: { x: 390, y: 710 },
        RU: { x: 459, y: 710 },
        LD: { x: 390, y: 787 },
        RD: { x: 459, y: 787 },
        direction: "RIGHTUP",
        center: { x: 425, y: 787 },
        distance: 38.6, //
    },
    2: {
        LU: { x: 459, y: 710 },
        RU: { x: 590, y: 710 },
        LD: { x: 459, y: 787 },
        RD: { x: 590, y: 787 },
        direction: "RIGHT",
        center: { x: NaN, y: 749 },
        distance: 81,
    },
};

//今の走行距離
let carsNowDistances = [0, 0, 0, 0];
//今の周回数
let carsNowLaps = [0, 0, 0, 0];
//前回走行のセクション
let beforeSections = [0, 0, 0, 0];

// 車が今どの座標にいるか判定 該当なければ-1 あればセクション番号
function checkNowSection(x, y) {
    for (const section in sections) {
        if (
            x >= sections[section].LU.x &&
            x <= sections[section].RU.x &&
            y >= sections[section].LU.y &&
            y <= sections[section].LD.y
        ) {
            return section;
        }
    }
    return -1;
}

//車個別処理 メイン
function move(carNum, nowXYA) {
    let motorCtrl = [0, 0];
    //目標座標と現在座標との距離, 増分(X or Y)
    const nowToNextIncrement = 20;
    //走行セクション取得
    const nowSection = checkNowSection(nowXYA[0], nowXYA[1]);
    //セクション内の走行距離
    let distanceInNowSection = 0;
    //セクション履歴保存
    beforeSections[carNum] = nowSection;

    //セクション内にいなければ、モーター停止
    if (nowSection === -1) {
        return [0, 0];
    } else {
        if (sections[nowSection].direction === "UP") {
            //進行方向UPであれば
            //セクション内走行距離
            distanceInNowSection =
                sections[nowSection].distance *
                ((sections[nowSection].LD.y - nowXYA[1]) /
                    (sections[nowSection].LD.y - sections[nowSection].LU.y));
            const nextXY = [
                sections[nowSection].center.x,
                nowXYA[1] - nowToNextIncrement,
            ];
            //モーター指令
            motorCtrl = ctrlMotor(
                [nextXY[0] - nowXYA[0], nextXY[1] - nowXYA[1]],
                nowXYA[2],
                30,
            );
        } else if (sections[nowSection].direction === "RIGHTUP") {
            //進行方向RIGHTUPであれば
            //セクション内走行距離
            distanceInNowSection =
                sections[nowSection].distance *
                ((nowXYA[0] - sections[nowSection].center.x) /
                    (sections[nowSection].RD.x -
                        sections[nowSection].center.x));
            //NOTE 発振防ぐため、深く曲がり、オーバーシュートしない用の*0.5
            //NOTE 走行距離算出時は、長辺を採用する！
            const nextXY = [
                nowXYA[0] + nowToNextIncrement,
                nowXYA[1] - nowToNextIncrement * 0.5,
            ];
            motorCtrl = ctrlMotor(
                [nextXY[0] - nowXYA[0], nextXY[1] - nowXYA[1]],
                nowXYA[2],
                30,
            );
        } else if (sections[nowSection].direction === "RIGHT") {
            //進行方向RIGHTであれば
            //セクション内走行距離
            distanceInNowSection =
                sections[nowSection].distance *
                ((nowXYA[0] - sections[nowSection].LD.x) /
                    (sections[nowSection].RD.x - sections[nowSection].LD.x));
            const nextXY = [
                nowXYA[0] + nowToNextIncrement,
                sections[nowSection].center.y,
            ];
            motorCtrl = ctrlMotor(
                [nextXY[0] - nowXYA[0], nextXY[1] - nowXYA[1]],
                nowXYA[2],
                30,
            );
        }
    }

    //走行距離算出
    carsNowDistances[nowSection] = 0;
    //毎回上書きする
    //FIXME 未検証ここから
    //1, 周回数分の距離
    for (let i = 0; i < carsNowLaps[carNum]; i++) {
        for (let i = 0; i < sections.length; i++) {
            carsNowDistances[nowSection] += sections[i].distance;
        }
    }
    //2, セクションごとの走行距離を加算
    for (let i = 0; i < nowSection; i++) {
        carsNowDistances[nowSection] += sections[i].distance;
    }
    // FIXME 未検証ここまで
    //3, セクション内の走行距離を加算
    carsNowDistances[nowSection] += distanceInNowSection;
    console.log(carsNowDistances[nowSection]);
    return motorCtrl;
}

function ctrlMotor(nowToNextSimpleDist, nowA, speed) {
    let relAngle =
        (Math.atan2(nowToNextSimpleDist[1], nowToNextSimpleDist[0]) * 180) /
            Math.PI -
        nowA;
    relAngle = relAngle % 360;
    if (relAngle < -180) {
        relAngle += 360;
    } else if (relAngle > 180) {
        relAngle -= 360;
    }
    const ratio = 1 - Math.abs(relAngle) / 90;
    if (relAngle > 0) {
        return [speed, speed * ratio];
    } else {
        return [speed * ratio, speed];
    }
}

async function main() {
    const cubes = await new NearScanner(1).start();
    const car0 = await cubes[0].connect();

    let car0XYA = [0, 0, 0];

    car0.on("id:position-id", (data) => {
        car0XYA = [data.x, data.y, data.angle];
    });

    setInterval(() => {
        car0.move(...move(0, car0XYA), 100);
    }, 50);
}

main();
