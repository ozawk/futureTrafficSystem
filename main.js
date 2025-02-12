import { NearScanner } from "@toio/scanner";

const carsNum = 4;
const cubes = await new NearScanner(carsNum).start();

const car_0 = await cubes[0].connect();
const car_1 = await cubes[1].connect();
const car_2 = await cubes[2].connect();
const car_3 = await cubes[3].connect();

//道データ
// const totalRoadDist = 108.5;
const origin_x = 673;
const origin_y = 830;
const coordinatePerCentimeter = 7.26;

const roadPointPositions = [
    { x: 0, y: 8 },
    { x: 0, y: 10 },
    { x: 0, y: 12 },
    { x: 0, y: 14 },
    { x: 0, y: 16 },
    { x: 0, y: 18 },
    { x: 0, y: 20 }, //ここから分離 ここは6
    { x: 0, y: 22 },
    { x: 0, y: 24 },
    { x: 0, y: 26 },
    { x: 0, y: 28 },
    { x: 0, y: 30 },
    { x: 0, y: 32 }, //
    { x: 0, y: 34 },
    { x: 1, y: 36 }, //左上
    { x: 3, y: 37 },
    { x: 6, y: 39 }, //
    { x: 10, y: 40 },
    { x: 12, y: 40 },
    { x: 14, y: 40 },
    { x: 18, y: 40 }, //
    { x: 21, y: 39 },
    { x: 23, y: 37 }, //右上
    { x: 24, y: 34 },
    { x: 24, y: 30 }, //
    { x: 24, y: 30 },
    { x: 24, y: 28 },
    { x: 24, y: 26 },
    { x: 24, y: 24 },
    { x: 24, y: 22 },
    { x: 24, y: 20 }, //ここまで分離 ここは30
    { x: 24, y: 18 },
    { x: 24, y: 16 },
    { x: 24, y: 14 },
    { x: 24, y: 12 },
    { x: 24, y: 10 },
    { x: 24, y: 8 },
    { x: 23, y: 5 },
    { x: 22, y: 2 }, //右下
    { x: 19, y: 1 },
    { x: 16, y: 0 },
    { x: 14, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 }, //左下
    { x: 0, y: 0 },
];

const separateRoadPointPositions = [
    { x: 3, y: 24 },
    { x: 3, y: 24 },
    { x: 3, y: 24 },
    { x: 5, y: 25 },
    { x: 8, y: 25 },
    { x: 10, y: 25 },
    { x: 12, y: 25 },
    { x: 14, y: 25 },
    { x: 16, y: 25 },
    { x: 19, y: 25 },
    { x: 22, y: 24 },
    { x: 22, y: 19 },
    { x: 22, y: 16 },
];

let carsNowSectionNum = [0, 0, 0, 0];
let carsSpaceDist = [0, 0, 0, 0];
let nowSeparateCarNum = Math.floor(Math.random() * 4);
let nowSectionNumSeparate = 0;
let carsIsNowInSeparate = [false, false, false, false];
let waitTimeContInSeparate = 0;
let isGo = true;
let isTrackCont = 0;
let isFirstInPoint = true;
let captureOrderBeforeSeparate = [0, 0, 0, 0];
let carLrsD = [0, 0, 0, 0, 0, 0, 0, 0];

let carsNowPosition = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
]; //[x,y,a]

car_0.on("id:position-id", (data) => {
    carsNowPosition[0][0] = data.x;
    carsNowPosition[0][1] = data.y;
    carsNowPosition[0][2] = data.angle;
});
car_1.on("id:position-id", (data) => {
    carsNowPosition[1][0] = data.x;
    carsNowPosition[1][1] = data.y;
    carsNowPosition[1][2] = data.angle;
});
car_2.on("id:position-id", (data) => {
    carsNowPosition[2][0] = data.x;
    carsNowPosition[2][1] = data.y;
    carsNowPosition[2][2] = data.angle;
});
car_3.on("id:position-id", (data) => {
    carsNowPosition[3][0] = data.x;
    carsNowPosition[3][1] = data.y;
    carsNowPosition[3][2] = data.angle;
});

setInterval(() => {
    //モーター指令サイクル
    const data = [
        move(
            0,
            carsNowPosition[0][0],
            carsNowPosition[0][1],
            carsNowPosition[0][2],
        ),
        move(
            1,
            carsNowPosition[1][0],
            carsNowPosition[1][1],
            carsNowPosition[1][2],
        ),
        move(
            2,
            carsNowPosition[2][0],
            carsNowPosition[2][1],
            carsNowPosition[2][2],
        ),
        move(
            3,
            carsNowPosition[3][0],
            carsNowPosition[3][1],
            carsNowPosition[3][2],
        ),
    ];
    car_0.move(data[0][0] / 1, data[0][1] / 1, 100);
    car_1.move(data[1][0] / 1, data[1][1] / 1, 100);
    car_2.move(data[2][0] / 1, data[2][1] / 1, 100);
    car_3.move(data[3][0] / 1, data[3][1] / 1, 100);
    carLrsD = [
        data[0][0],
        data[0][1],
        data[1][0],
        data[1][1],
        data[2][0],
        data[2][1],
        data[3][0],
        data[3][1],
    ];
}, 20);

function move(carNum, nowX, nowY, nowAng) {
    let nowToNextPointSimpleDist;
    let speed;
    if (!carsIsNowInSeparate[carNum]) {
        let nowToBeforePointSimpleDist = [0, 0];
        let nowToNextPointDist = 0;
        let nowToBeforePointDist = 0;
        let nowToMostNearPositionNumAndDist = [0, 100000];

        //一番近いPointを探す 齟齬確認用
        for (let i = 0; i < roadPointPositions.length; i++) {
            const dist = Math.sqrt(
                (origin_x +
                    roadPointPositions[i].x * coordinatePerCentimeter -
                    nowX) **
                    2 +
                    (origin_y -
                        roadPointPositions[i].y * coordinatePerCentimeter -
                        nowY) **
                        2,
            );
            if (nowToMostNearPositionNumAndDist[1] > dist) {
                nowToMostNearPositionNumAndDist = [i, dist];
            }
        }

        //目標Pointに対するSimpleDistを算出 距離算出用とモータ制御用
        nowToNextPointSimpleDist = [
            origin_x +
                roadPointPositions[carsNowSectionNum[carNum]].x *
                    coordinatePerCentimeter -
                nowX,
            origin_y -
                roadPointPositions[carsNowSectionNum[carNum]].y *
                    coordinatePerCentimeter -
                nowY,
        ];

        //目標の1つ前のPointに対するSimpleDistを算出
        let getBeforePointNum;
        if (carsNowSectionNum[carNum] > 0) {
            getBeforePointNum = carsNowSectionNum[carNum] - 1;
        } else {
            getBeforePointNum = 0;
        }
        nowToBeforePointSimpleDist = [
            origin_x +
                roadPointPositions[getBeforePointNum].x *
                    coordinatePerCentimeter -
                nowX,
            origin_y -
                roadPointPositions[getBeforePointNum].y *
                    coordinatePerCentimeter -
                nowY,
        ];

        //目標Pointに対する斜め距離算出
        nowToNextPointDist = Math.sqrt(
            nowToNextPointSimpleDist[0] ** 2 + nowToNextPointSimpleDist[1] ** 2,
        );
        //目標の1つ前のPointに対する斜め距離算出
        nowToBeforePointDist = Math.sqrt(
            nowToBeforePointSimpleDist[0] ** 2 +
                nowToBeforePointSimpleDist[1] ** 2,
        );

        //走行セクションと最近ポイントに齟齬が生じた時
        if (
            nowToNextPointDist > nowToMostNearPositionNumAndDist[1] &&
            nowToBeforePointDist > nowToMostNearPositionNumAndDist[1]
        ) {
            console.log("齟齬:" + carNum);
            //齟齬があれば走行セクション修正
            //TODO これ多分移行処理しっかりしないと良くない 小澤
            carsNowSectionNum[carNum] = nowToMostNearPositionNumAndDist[0] + 1;
        }
        if (
            carsNowSectionNum[carNum] <
            carsNowSectionNum.toSorted((a, b) => {
                return a - b;
            })[3]
        ) {
            //1周内で先頭でない場合
            carsSpaceDist[carNum] =
                carsNowSectionNum.toSorted((a, b) => {
                    return a - b;
                })[
                    carsNowSectionNum
                        .toSorted((a, b) => {
                            return a - b;
                        })
                        .indexOf(carsNowSectionNum[carNum]) + 1
                ] - carsNowSectionNum[carNum];
        } else {
            //一周内で先頭ではない場合
            carsSpaceDist[carNum] =
                roadPointPositions.length -
                carsNowSectionNum[carNum] +
                carsNowSectionNum.toSorted((a, b) => {
                    return a - b;
                })[0];
        }
        let a;
        if (
            !(carsNowSectionNum[carNum] <= 10 || carsNowSectionNum[carNum] > 40)
        ) {
            a = 12;
        } else {
            a = 0;
        }

        if (carsSpaceDist[carNum] > 20) {
            //常に先頭の場合をさす
            console.log("先頭");
            if (carsNowSectionNum[carNum] <= 1) {
                //先頭がスタート地点を通れば
                // nowSeparateCarNum = Math.floor(Math.random() * 4);
            }
            speed = 20;
        } else if (carsSpaceDist[carNum] > 5) {
            speed = 46;
        } else if (carsSpaceDist[carNum] > 4) {
            speed = 34;
        } else if (carsSpaceDist[carNum] > 3) {
            speed = 20;
        } else if (carsSpaceDist[carNum] > 2) {
            speed = a;
        } else if (carsSpaceDist[carNum] > 1) {
            speed = a;
        } else if (carsSpaceDist[carNum] > 0) {
            speed = a;
        } else {
            speed = a;
        }

        if (nowToNextPointDist < 10) {
            //セクション移行処理
            carsNowSectionNum[carNum]++;
            if (carsNowSectionNum[carNum] == 5 && nowSeparateCarNum == carNum) {
                captureOrderBeforeSeparate = 0;
                for (let i = 0; i < carsNowSectionNum.length; i++) {
                    if (carsNowSectionNum[i] > 5 && carsNowSectionNum[i] < 30) {
                        captureOrderBeforeSeparate++;
                    }
                }
                carsIsNowInSeparate[carNum] = true;
            }
        }
        if (carsNowSectionNum[carNum] > roadPointPositions.length - 1) {
            carsNowSectionNum[carNum] = 0;
        }
    } else {
        nowToNextPointSimpleDist = [
            origin_x +
                separateRoadPointPositions[nowSectionNumSeparate].x *
                    coordinatePerCentimeter -
                nowX,
            origin_y -
                separateRoadPointPositions[nowSectionNumSeparate].y *
                    coordinatePerCentimeter -
                nowY,
        ];

        const nowToNextPointDist = Math.sqrt(
            nowToNextPointSimpleDist[0] ** 2 + nowToNextPointSimpleDist[1] ** 2,
        );
        if (isGo) {
            speed = 20;
            // console.log(
            //     carsNowSectionNum.toSorted((a, b) => {
            //         return a - b;
            //     })[2], //2と3の間に割り込む
            // );
        } else {
            speed = 0;
        }
        if (nowToNextPointDist < 10 && nowSeparateCarNum == carNum) {
            isFirstInPoint = false;
            //セクション移行処理
            nowSectionNumSeparate++;
            if (nowSectionNumSeparate > separateRoadPointPositions.length - 1) {
                console.log("合流完了");
                //分離終了
                carsIsNowInSeparate = [false, false, false, false];
                nowSeparateCarNum = Math.floor(Math.random() * 4);
                nowSectionNumSeparate = 0;
                waitTimeContInSeparate = 0;
                isTrackCont = 0;
            } else if (
                nowSectionNumSeparate > 4 &&
                waitTimeContInSeparate == 0
            ) {
                waitTimeContInSeparate = Date.now();
                isGo = false;
            } else {
                isTrackCont++;
                if (isTrackCont > 6) {
                    carsNowSectionNum[carNum] = 7 + nowSectionNumSeparate * 2;
                } else {
                    carsNowSectionNum[carNum] = 5;
                }
                isGo = true;
            }
        }
        let waitTime;
        if (captureOrderBeforeSeparate == 0) {
            waitTime = 5000;
        } else if (captureOrderBeforeSeparate == 1) {
            waitTime = 4000;
        } else if (captureOrderBeforeSeparate == 2) {
            waitTime = 4000; //
        } else {
            waitTime = 4000;
        }

        if (
            nowSectionNumSeparate > 5 &&
            0 < Date.now() - waitTimeContInSeparate &&
            Date.now() - waitTimeContInSeparate < waitTime
        ) {
            isGo = false;
        } else {
            isGo = true;
        }
    }
    console.log(carsNowSectionNum);
    return ctrlLrMotor(nowToNextPointSimpleDist, nowAng, speed);
}

let a = 0;
function ctrlLrMotor(nowToNextPointSimpleDist, nowAng, speed) {
    let relAngle =
        (Math.atan2(nowToNextPointSimpleDist[1], nowToNextPointSimpleDist[0]) *
            180) /
            Math.PI -
        nowAng;
    relAngle = relAngle % 360;
    if (relAngle < -180) {
        relAngle += 360;
    } else if (relAngle > 180) {
        relAngle -= 360;
    }
    const ratio = 1 - Math.abs(relAngle) / 90;
    a = ratio;
    if (relAngle > 0) {
        return [speed, speed * (ratio + (a - ratio) * 40)];
    } else {
        return [speed * (ratio + (a - ratio) * 40), speed];
    }
}
