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
        LU: { x: 651, y: 712 },
        RU: { x: 689, y: 712 },
        LD: { x: 651, y: 772 },
        RD: { x: 689, y: 772 },
        direction: "UP",
        center: { x: 670, y: NaN },
        distance: 60,
    }, //はじまりのセクション
    1: {
        LU: { x: 651, y: 593 },
        RU: { x: 703, y: 593 },
        LD: { x: 651, y: 712 },
        RD: { x: 703, y: 712 },
        direction: "UP",
        center: { x: 670, y: NaN },
        distance: 119,
        isBranchSection: true,
        branch: {
            type: "SPLIT",
            center: { x: 670, y: 712 },
            distance: 38,
        },
    }, //分岐開始~直線終了までのセクション
    2: {
        LU: { x: 651, y: 520 },
        RU: { x: 731, y: 520 },
        LD: { x: 651, y: 593 },
        RD: { x: 731, y: 593 },
        direction: "RIGHTUP",
        center: { x: 670, y: 593 },
        distance: 70.8,
    }, //左上の右折セクション
    3: {
        LU: { x: 731, y: 520 },
        RU: { x: 790, y: 520 },
        LD: { x: 731, y: 554 },
        RD: { x: 790, y: 554 },
        direction: "RIGHT",
        center: { x: NaN, y: 537 },
        distance: 59,
    }, //上の右方向に直進セクション
    4: {
        LU: { x: 790, y: 520 },
        RU: { x: 865, y: 520 },
        LD: { x: 790, y: 596 },
        RD: { x: 865, y: 596 },
        direction: "RIGHTDN",
        center: { x: 790, y: 537 },
        distance: 69.9,
    }, //右上の右折セクション
    5: {
        LU: { x: 783, y: 596 },
        RU: { x: 865, y: 596 },
        LD: { x: 783, y: 696 },
        RD: { x: 865, y: 696 },
        direction: "DOWN",
        center: { x: 840, y: NaN },
        distance: 100,
        isBranchSection: true,
        branch: {
            type: "MERGE",
            center: { x: 800, y: 655 },
            distance: 69.3,
        },
    }, //右折終了~合流終了までのセクション
    6: {
        LU: { x: 831, y: 696 },
        RU: { x: 865, y: 696 },
        LD: { x: 831, y: 772 },
        RD: { x: 865, y: 772 },
        direction: "DOWN",
        center: { x: 848, y: NaN },
        distance: 86,
    }, //右下右折までの直線セクション
    7: {
        LU: { x: 791, y: 772 },
        RU: { x: 865, y: 772 },
        LD: { x: 791, y: 849 },
        RD: { x: 865, y: 849 },
        direction: "LEFTDN",
        center: { x: 848, y: 772 },
        distance: 68.8,
    }, //右下右折セクション
    8: {
        LU: { x: 731, y: 812 },
        RU: { x: 791, y: 812 },
        LD: { x: 731, y: 849 },
        RD: { x: 791, y: 849 },
        direction: "LEFT",
        center: { x: NaN, y: 830 },
        distance: 60,
    }, //下の左方向に直進セクション
    9: {
        LU: { x: 651, y: 772 },
        RU: { x: 731, y: 772 },
        LD: { x: 651, y: 849 },
        RD: { x: 731, y: 849 },
        direction: "LEFTUP",
        center: { x: 731, y: 830 },
        distance: 70.5,
    }, //左下の右折セクション
    10: {
        LU: { x: 703, y: 593 },
        RU: { x: 783, y: 593 },
        LD: { x: 703, y: 712 },
        RD: { x: 783, y: 712 },
        direction: "LEFT",
        center: { x: 670, y: NaN },
        distance: 49,
        isBranchSection: true,
        branch: {
            type: "LINE",
            center: { x: NaN, y: 655 },
            distance: 80,
        },
    }, //中心線の
};

const branchIncludeSections = [1, 5, 10];

//今の走行距離
let carsNowDistances = [0, 0, 0, 0];
//今の周回数
let carsNowLaps = [0, 0, 0, 0];
//分岐する車両
let branchCar = [true, false, false, false];
//今の速度
let carsNowSpeeds = [0, 0, 0, 0];
//前回の速度
let carsBeforeSpeeds = [0, 0, 0, 0];
//前回走行のセクション
let beforeSections = [0, 0, 0, 0];
//分岐線中にいる車の分岐線中走行距離
let carNowDistanceInBranch = 0;

const PGain = 1;
const DGain = 0.3;

let speed = 0;

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

//車速を決定
function setSpeed(carNum, isNowInBranch, nowSection, isMerge) {
    console.log(carsNowDistances);
    console.log(carsNowSpeeds);
    //[少ないもんじゅん]でソートする ただし、NaNは配列から排除
    const sortedDistances = Array.from(carsNowDistances)
        .filter((value) => !Number.isNaN(value))
        .sort((a, b) => a - b);
    // console.log("=====");
    if (isMerge) {
        return 30;
    }
    if (isNowInBranch) {
        //分岐中
        return 20;
    }

    if (
        carsNowDistances[carNum] >= sortedDistances[sortedDistances.length - 1]
    ) {
        //先頭
        return 24;
    } else {
        //数字が1つ多い、前車両との車間距離を算出
        let distanceToNextCar =
            sortedDistances[
                sortedDistances.indexOf(carsNowDistances[carNum]) + 1
            ] - carsNowDistances[carNum];

        let speed =
            (distanceToNextCar - 40) * 0.5 * PGain +
            ((distanceToNextCar - 40) * 0.5 - carsBeforeSpeeds[carNum]) * DGain;
        if (speed < 12) {
            speed = 12;
        } else if (speed > 30) {
            speed = 30;
        }
        carsBeforeSpeeds[carNum] = speed;
        return speed;
        //TODO ここまで秋山領域
    }
}

//走行距離算出
function calcCarsNowDistance(carNum, nowSection, distanceInNowSection) {
    carsNowDistances[carNum] = 0;
    //毎回上書きする

    if (!(sections[nowSection].isBranchSection == true && branchCar[carNum])) {
        //分岐セクション中でなければ
        //周回アップデート
        if (
            beforeSections[carNum] == Object.keys(sections).length - 2 &&
            nowSection == 0
        ) {
            //NOTE 本来はObject.keys(sections).length - 1であるが、分岐セクション(道中)データが1つ挿入されているので,-2している
            carsNowLaps[carNum]++;
        }
        // 1, 周回ごとの走行距離を加算;
        for (let i = 0; i < carsNowLaps[carNum]; i++) {
            carsNowDistances[carNum] += 752;
            //FIXME ちゃんと計算するようにする
            //今走行中の周回以前
            // for (const section in sections) {
            //     console.log("NNNN");
            //     carsNowDistances[carNum] += sections[section].distance;
            // }
        }

        //2, セクションごとの走行距離を加算
        for (let i = 0; i < nowSection; i++) {
            //今走行中のセクション以前
            carsNowDistances[carNum] += sections[i].distance;
        }
        //3, セクション内の走行距離を加算
        carsNowDistances[carNum] += distanceInNowSection;

        //セクション履歴保存
        beforeSections[carNum] = nowSection;
    } else {
        carsNowDistances[carNum] = NaN;
    }
}

//分岐線中の走行距離算出
function calcCarsNowDistanceInBranch(carNum, nowSection, distanceInNowSection) {
    //これは分岐車両が分岐線中にいるとき発火します
    carNowDistanceInBranch = 0;
    //初期化
    //FIXME ちゃんとする
    if (nowSection == 1) {
        //SPLITセクション
        carNowDistanceInBranch = distanceInNowSection;
    } else if (nowSection == 10) {
        //直線セクション
        carNowDistanceInBranch =
            sections[1].branch.distance + distanceInNowSection;
    } else if (nowSection == 5) {
        //MERGEセクション
        carNowDistanceInBranch =
            sections[1].branch.distance +
            sections[10].branch.distance +
            distanceInNowSection;
    }
}

//ゴーストのインサート
function insertGhost(carNum) {
    //これも必ず分岐車両分岐中に発火する
    if (carNowDistanceInBranch > 80) {
        let ghostCarDistance = 0;
        for (let i = 0; i < carsNowLaps[carNum]; i++) {
            ghostCarDistance += 752;
            //FIXME ちゃんと計算するようにする
        }
        ghostCarDistance += 320;
        ghostCarDistance += carNowDistanceInBranch;
        carsNowDistances[carNum] = ghostCarDistance;
        console.log(carsNowDistances, ghostCarDistance);

        //合流先の、前の車両との距離を算出
        const sortedDistances = Array.from(carsNowDistances)
            .filter((value) => !Number.isNaN(value))
            .sort((a, b) => a - b);
        let distanceToNextCar =
            sortedDistances[
                sortedDistances.indexOf(carsNowDistances[carNum]) + 1
            ] - carsNowDistances[carNum];
        console.log(distanceToNextCar);
        let speed = 18;
        if (distanceToNextCar < 30) {
            speed = 0;
        }
        return speed;
    }
}
//分岐する車両決定
function setBranchCar(carNum, nowSection) {
    const sortedDistances = Array.from(carsNowDistances)
        .filter((value) => !Number.isNaN(value))
        .sort((a, b) => a - b);
    if (
        nowSection == 0 &&
        beforeSections[carNum] == Object.keys(sections).length - 2 &&
        carsNowDistances[carNum] == sortedDistances[sortedDistances.length - 1]
    ) {
        //先頭車がセクション0に進入時に、分岐車を決定する
        //この時点で最後尾の車両が分岐する
        branchCar = branchCar.fill(false);
        branchCar[carsNowDistances.indexOf(sortedDistances[0])] = true;
        //分岐線中の走行距離を初期化
        carNowDistanceInBranch = 0;
    }
}

//車個別処理 メイン
function move(carNum, nowXYA) {
    let motorCtrlInputData = [0, 0];
    //モーター指令に渡すデータ
    // nowToNextSimpleDist, nowAngle,
    let motorCtrl = [0, 0];
    //目標座標と現在座標との距離, 増分(X or Y)
    const nowToNextIncrement = 20;
    //走行セクション取得
    const nowSection = checkNowSection(nowXYA[0], nowXYA[1]);
    //セクション内の走行距離
    let distanceInNowSection = 0;
    //セクション内にいなければ、モーター停止
    if (nowSection === -1) {
        return [0, 0];
    } else {
        if (sections[nowSection].isBranchSection == true && branchCar[carNum]) {
            //分岐セクションかつ、分岐する車両であれば
            if (sections[nowSection].branch.type == "SPLIT") {
                // 分岐開始
                //セクション内走行距離
                //NOTE 発振防ぐため、深く曲がり、オーバーシュートしない用の*0.5
                //NOTE 走行距離算出時は、長辺を採用する！
                distanceInNowSection =
                    sections[nowSection].branch.distance *
                    ((nowXYA[0] - sections[nowSection].branch.center.x) /
                        (sections[nowSection].RD.x -
                            sections[nowSection].branch.center.x));
                const nextXY = [
                    nowXYA[0] + nowToNextIncrement,
                    nowXYA[1] - nowToNextIncrement * 0.8,
                ];
                motorCtrlInputData = [
                    [nextXY[0] - nowXYA[0], nextXY[1] - nowXYA[1]],
                    nowXYA[2],
                ];
            } else if (sections[nowSection].branch.type == "MERGE") {
                // 分岐終了
                distanceInNowSection =
                    sections[nowSection].branch.distance *
                    ((nowXYA[1] - sections[nowSection].branch.center.y) /
                        (sections[nowSection].LD.y -
                            sections[nowSection].branch.center.y));
                const nextXY = [
                    nowXYA[0] + nowToNextIncrement * 0.9,
                    nowXYA[1] + nowToNextIncrement,
                ];
                motorCtrlInputData = [
                    [nextXY[0] - nowXYA[0], nextXY[1] - nowXYA[1]],
                    nowXYA[2],
                ];
            } else {
                // 分岐道中
                distanceInNowSection =
                    sections[nowSection].branch.distance *
                    ((nowXYA[0] - sections[nowSection].LD.x) /
                        (sections[nowSection].RD.x -
                            sections[nowSection].LD.x));
                const nextXY = [
                    nowXYA[0] + nowToNextIncrement,
                    sections[nowSection].branch.center.y,
                ];
                motorCtrlInputData = [
                    [nextXY[0] - nowXYA[0], nextXY[1] - nowXYA[1]],
                    nowXYA[2],
                ];
            }
        } else if (sections[nowSection].direction === "UP") {
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
            motorCtrlInputData = [
                [nextXY[0] - nowXYA[0], nextXY[1] - nowXYA[1]],
                nowXYA[2],
            ];
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
            motorCtrlInputData = [
                [nextXY[0] - nowXYA[0], nextXY[1] - nowXYA[1]],
                nowXYA[2],
            ];
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
            motorCtrlInputData = [
                [nextXY[0] - nowXYA[0], nextXY[1] - nowXYA[1]],
                nowXYA[2],
            ];
        } else if (sections[nowSection].direction === "RIGHTDN") {
            //進行方向RIGHTDNであれば
            //セクション内走行距離
            const nextXY = [
                nowXYA[0] + nowToNextIncrement * 0.5,
                nowXYA[1] + nowToNextIncrement,
            ];
            distanceInNowSection =
                sections[nowSection].distance *
                ((nowXYA[1] - sections[nowSection].center.y) /
                    (sections[nowSection].LD.y -
                        sections[nowSection].center.y));
            motorCtrlInputData = [
                [nextXY[0] - nowXYA[0], nextXY[1] - nowXYA[1]],
                nowXYA[2],
            ];
        } else if (sections[nowSection].direction === "DOWN") {
            //進行方向DOWNであれば
            //セクション内走行距離
            distanceInNowSection =
                sections[nowSection].distance *
                ((nowXYA[1] - sections[nowSection].LU.y) /
                    (sections[nowSection].LD.y - sections[nowSection].LU.y));
            const nextXY = [
                sections[nowSection].center.x,
                nowXYA[1] + nowToNextIncrement,
            ];
            motorCtrlInputData = [
                [nextXY[0] - nowXYA[0], nextXY[1] - nowXYA[1]],
                nowXYA[2],
            ];
        } else if (sections[nowSection].direction === "LEFTDN") {
            //進行方向LEFTDNであれば
            //セクション内走行距離
            distanceInNowSection =
                sections[nowSection].distance *
                ((sections[nowSection].center.x - nowXYA[0]) /
                    (sections[nowSection].center.x -
                        sections[nowSection].LD.x));
            const nextXY = [
                nowXYA[0] - nowToNextIncrement,
                nowXYA[1] + nowToNextIncrement * 0.5,
            ];
            motorCtrlInputData = [
                [nextXY[0] - nowXYA[0], nextXY[1] - nowXYA[1]],
                nowXYA[2],
            ];
        } else if (sections[nowSection].direction === "LEFT") {
            //進行方向LEFTであれば
            //セクション内走行距離
            distanceInNowSection =
                sections[nowSection].distance *
                ((sections[nowSection].RD.x - nowXYA[0]) /
                    (sections[nowSection].RD.x - sections[nowSection].LD.x));
            const nextXY = [
                nowXYA[0] - nowToNextIncrement,
                sections[nowSection].center.y,
            ];
            motorCtrlInputData = [
                [nextXY[0] - nowXYA[0], nextXY[1] - nowXYA[1]],
                nowXYA[2],
            ];
        } else if (sections[nowSection].direction === "LEFTUP") {
            //進行方向LEFTUPであれば
            //セクション内走行距離
            distanceInNowSection =
                sections[nowSection].distance *
                ((sections[nowSection].center.y - nowXYA[1]) /
                    (sections[nowSection].center.y -
                        sections[nowSection].LU.y));
            const nextXY = [
                nowXYA[0] - nowToNextIncrement * 0.5,
                nowXYA[1] - nowToNextIncrement,
            ];
            motorCtrlInputData = [
                [nextXY[0] - nowXYA[0], nextXY[1] - nowXYA[1]],
                nowXYA[2],
            ];
        }
    }

    //分岐車両決定
    setBranchCar(carNum, nowSection);

    //走行距離算出
    calcCarsNowDistance(carNum, nowSection, distanceInNowSection);
    let isMerge = false;
    let isNowInBranch = false;
    let spd;
    //分岐中であれば
    if (Number.isNaN(carsNowDistances[carNum])) {
        //分岐中の走行距離算出
        calcCarsNowDistanceInBranch(carNum, nowSection, distanceInNowSection);
        //ゴーストのインサート
        spd = insertGhost(carNum);
        isNowInBranch = true;
    }
    if (sections[nowSection].isBranchSection == true && branchCar[carNum]) {
        if (sections[nowSection].branch.type == "MERGE") {
            isMerge = true;
        }
    }
    //速度決定
    if (spd == undefined) {
        motorCtrl = ctrlMotor(
            motorCtrlInputData[0],
            motorCtrlInputData[1],
            setSpeed(carNum, isNowInBranch, nowSection, isMerge),
        );
    } else {
        motorCtrl = ctrlMotor(
            motorCtrlInputData[0],
            motorCtrlInputData[1],
            spd,
        );
    }
    return motorCtrl;
}

let beforeRatio = 0;
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

    beforeRatio = ratio;
    if (relAngle > 0) {
        return [speed, speed * (ratio + (beforeRatio - ratio) * 40)];
    } else {
        return [speed * (ratio + (beforeRatio - ratio) * 40), speed];
    }
}

const cubes = await new NearScanner(4).start();
const car0 = await cubes[0].connect();
const car1 = await cubes[1].connect();
const car2 = await cubes[2].connect();
const car3 = await cubes[3].connect();

let car0XYA = [0, 0, 0];
let car1XYA = [0, 0, 0];
let car2XYA = [0, 0, 0];
let car3XYA = [0, 0, 0];

async function main() {
    let isPressed = false;
    let isPlaying = false;
    let buttonPressInterval = 0;
    car0.on("button:press", () => {
        isPressed = true;
    });
    car1.on("button:press", () => {
        isPressed = true;
    });
    car2.on("button:press", () => {
        isPressed = true;
    });
    car3.on("button:press", () => {
        isPressed = true;
    });

    car0.on("id:position-id", (data) => {
        car0XYA = [data.x, data.y, data.angle];
    });
    car1.on("id:position-id", (data) => {
        car1XYA = [data.x, data.y, data.angle];
    });
    car2.on("id:position-id", (data) => {
        car2XYA = [data.x, data.y, data.angle];
    });
    car3.on("id:position-id", (data) => {
        car3XYA = [data.x, data.y, data.angle];
    });

    setInterval(() => {
        buttonPressInterval += 1;
        if (isPressed && buttonPressInterval > 40) {
            isPlaying = !isPlaying;
            buttonPressInterval = 0;
        }
        isPressed = false;

        if (isPlaying) {
            car0.move(...move(0, car0XYA), 100);
            car1.move(...move(1, car1XYA), 100);
            car2.move(...move(2, car2XYA), 100);
            car3.move(...move(3, car3XYA), 100);
        }
    }, 50);
}
main();
