import * as d3 from 'd3';
import './lopa.tool-tip';

export default class Lopa {

    constructor(container, config, options) {
        this.container = container;
        this.config = config;
        this.options = options;
        this.initialize();
    }

    findXPos(seatData) {
        const seatNo = parseInt(seatData.value);
        if (seatNo > 0 && seatNo < 10) return 8;
        else if (seatNo >= 10 && seatNo < 100) return 5;
        else return 2;
    }

    findYPos(seatData) {
        const seatNo = parseInt(seatData.seat.replace(/\D/g, ''));
        let seat = this.deckArr.find(cls => cls.num.includes(seatNo));
        return seat && seat.seatType === 'small' ? (this.seatSize.smHeight / 2) + 2 : (this.seatSize.lgHeight / 2) + 2;
    }

    highlight(seat) {
        if (seat && seat !== '') {
            const selector = 'element-hover';
            this.highlightHandler(seat, selector);
        }
    }

    select(seat) {
        if (seat && seat !== '') {
            const selector = 'selected';
            this.highlightHandler(seat, selector);
        }
    }

    highlightHandler(seat, selector) {
        const sel = seat.replace(/\'/g, '').split(/(\d+)/).filter(Boolean);
        const seatNumber = `${sel[1]}${sel[0]}`;
        this.container.querySelectorAll('.' + selector).forEach(ele => ele.classList.remove(selector));
        const selected = this.container.querySelector('.' + seatNumber);
        selected.classList.add(selector);
    }

    detectPadding(seat) {
        let padding = 0;
        this.cabinClsSeatLtrs.forEach((arr, i) => {
            if (arr.includes(seat)) {
                padding = this.padding.inner * i
            }
        });
        return padding;
    }

    roundedPath(x, y, width, height, radius) {
        return `M${x}, ${y}h${width - radius}a${radius}, ${radius} 0 0 1 ${radius}, ${radius} 
        v${height - 2 * radius} a${radius}, ${radius} 0 0 1 ${-radius}, ${radius}h${radius - width}z`;
    }

    calcHeight() {
        const totalHeight = this.cabinHeightByBay.reduce((tot, val) => tot + val);
        let height = ((this.seatLayoutConfig.y.length - 1) * this.padding.inner) + (totalHeight);
        if (!this.showDeckName && this.showCabinName) height = height + this.padding.top + 70;
        else if (this.showDeckName && this.showCabinName) height = height + (this.padding.top * 2) + 20;
        else if (this.showDeckName && !this.showCabinName) height += 15;
        else if (!this.showDeckName && !this.showCabinName) height += 20;
        return height;
    }

    currentCabinConf(cabinName) {
        return this.cabinClsConf.filter(cabin => cabin.cabin === cabinName)[0];
    }

    xAxis(scalePoint, cabinName, lavArr) {
        const _own = this;
        const cabin = this.currentCabinConf(cabinName);
        for (let i = 0; i < cabin.seatConf.length - 1; i++) {
            const xAxis = this.svg.append('g')
                .classed('xAxis', true);

            let colHeight = 0;
            _own.cabinHeightByBay.forEach((height, ind) => {
                if (ind < i) {
                    colHeight += height;
                }
            });

            const padding = this.showCabinName ? 15 : 10;
            let axisPadding = i > 0 ? i * (this.padding.inner + padding) : padding;

            xAxis.selectAll('text')
                .data(this.numData)
                .enter()
                .append('text')
                .text(d => d)
                .attr('style', 'font-size: 9px; fill: #c2c6c9;')
                .attr('transform', (d, ind) => {
                    const lavIndex = this.getLaventoriesGalleries(d, lavArr);
                    return `translate(${scalePoint + (lavIndex * 20) + ((ind + 1) * _own.seatSize.width) - 10}, 
                    ${_own.chartSize.height - axisPadding - (_own.cabinHeightByBay[i] + colHeight + 5)})`;
                });

        }
    }

    detectCabinHeight(ltr) {
        let height = 0;
        if (JSON.stringify(this.cabinHeightByBay) !== JSON.stringify(this.currentCabinHeight)) {
            this.cabinClsSeatLtrs.forEach((seats, i) => {
                if (seats.includes(ltr)) {
                    let deckHeight = 0;
                    let cabinheight = 0;
                    for (let j = 0; j < i; j++) {
                        deckHeight += this.cabinHeightByBay[j];
                        cabinheight += this.currentCabinHeight[j];
                    }
                    height = deckHeight - cabinheight;

                }
            });
        }

        return height;
    }

    alterSeatPosition(ltr) {
        let height = 0;
        let previousAisleHeightDifference = 0
        if (JSON.stringify(this.cabinHeightByBay) !== JSON.stringify(this.currentCabinHeight)) {
            this.cabinClsSeatLtrs.forEach((seats, i) => {
                if (seats.includes(ltr) && i !== 0) {
                    height = this.cabinHeightByBay[i] - this.currentCabinHeight[i];
                    height = i <= 1 && i !== this.cabinClsSeatLtrs.length - 1 ? height / 2 : height;
                }
            });
        }
        return height + previousAisleHeightDifference;
    }

    yAxis(alpha, seatH) {
        const _own = this;
        const height = this.showCabinName ? this.chartSize.height - 40 : this.chartSize.height;
        const yAxis = this.svg.append('g')
            .classed('yAxis', true);

        yAxis.selectAll('text')
            .data(alpha)
            .enter()
            .append('text')
            .text(d => d)
            .attr('transform', (d, index) => {
                const cabinPositionHeight = this.alterSeatPosition(d);
                const cabinHeight =  _own.detectCabinHeight(d);
                return `translate(${_own.currentScalePoint - _own.padding.inner + 22}, 
                    ${height + (seatH / 2) - 6 - cabinHeight - cabinPositionHeight - ((index + 1) * seatH) - _own.detectPadding(d)} )`
            })
            .attr('style', 'font-size: 9px; fill: #c2c6c9;');
    }

    initiateScales(cabinCls, seatLtrs) {
        const _own = this;
        let start = 0;
        let end = 0;
        this.numData = [];
        for (let i = cabinCls.startRow; i <= cabinCls.endRow; i++) {
            if (!cabinCls.noSeatRows.includes(i)) {
                this.numData.push(i);
            }
        }

        this.deckArr.push({
            seatType: cabinCls.seatType,
            num: this.numData
        });

        const seatBay = cabinCls.seatConfig.split('-').length - 1;
        start = 0 + this.padding.top;
        end = (seatBay * this.padding.inner) + this.clsCabinHeight + (seatBay === 1 ? 20 : 0);

        this.numberScale = d3.scaleLinear()
            .domain([cabinCls.startRow, cabinCls.endRow])
            .range([_own.currentScalePoint, _own.chartSize.width - _own.padding.left - _own.padding.right]);

        this.alphaScale = d3.scaleBand()
            .domain(seatLtrs)
            .range([start, end]);
    }

    findDeckData(clsConf) {
        const deckData = [];
        if (this.config.data) {
            let start = clsConf[0]['startRow'];
            let end = clsConf[0]['endRow'];
            clsConf.forEach(cls => {
                start = start >= cls.startRow ? cls.startRow : start;
                end = end <= cls.endRow ? cls.endRow : end;
            });
            this.config.data.forEach(data => {
                const seatNum = parseInt(data['seat'].replace(/\'/g, '').split(/(\d+)/).filter(Boolean)[0]);
                if (start <= seatNum && seatNum <= end) {
                    deckData.push(data)
                }
            });
        }
        return deckData;
    }

    initialize() {

        this.deckNameW = 0;
        this.deckArr = [];
        this.numData = [];
        this.classConfig = [];
        this.seatLetters = [];
        this.cabinClsConf = [];
        this.cabinClsSeatLtrs = [];
        this.numberScale = undefined;
        this.alphaScale = undefined;
        this.cabinRowNumHeight = [];
        this.chartSize = {};
        this.padding = {
            top: 50,
            bottom: 50,
            left: 10,
            right: 10,
            inner: 20
        };
        this.seatSize = {
            smHeight: 28,
            lgHeight: 42,
            width: 28
        };
        this.seatLayoutConfig = {
            x: 0,
            y: []
        };
        this.seatSplitConfig = {
            seatLtrs: [],
            splitConf: ''
        };
        this.airCraftHeight = [];

        this.svg = undefined;
        this.cabinName = undefined;
        this.deckNameDisplay = undefined;
        this.previousScalePoint = 0;
        this.currentScalePoint = this.padding.left;
        this.showDeckName = this.options.displayDeckName || this.options.displayDeckName === undefined;
        this.showCabinName = this.options.displayCabinClassName || this.options.displayCabinClassName === undefined;

        this.tool_tip = d3.tip()
            .attr("class", "lopa-tooltip")
            .offset([-8, 0])
            .html(seat => seat);

        this.chartWrapper = d3.select(this.container)
            .append('div')
            .classed('lopa-container', true);

        this.hoverHolder = this.chartWrapper
            .append('div')
            .classed('hover', true);

        if (this.config && this.config.deckConfig && this.config.deckConfig.length) {
            const deckCount = this.config.deckConfig.length;
            if (deckCount === 1) {
                this.config.deckConfig[0]['data'] = this.config['data'];
                this.drawLopa(this.config.deckConfig[0])
            } else if (deckCount > 1) {
                this.config.deckConfig.forEach(deck => {
                    deck['data'] = this.findDeckData(deck.cabinClassConfig);
                    this.drawLopa(deck)
                });
            }
        }

        if (this.airCraftHeight.length > 1) {
            const maxDeckHeight = Math.max.apply(Math, this.airCraftHeight.map(o => { return o.height; }));
            const minHeightDeck = this.airCraftHeight.find(deck => deck.height < maxDeckHeight);
            const heightDifference = (maxDeckHeight - minHeightDeck.height) / 2;
            document.getElementsByClassName(`lopa-chart-${minHeightDeck.deckName}`)[0].getElementsByTagName('svg')[0]
                .setAttribute('style', `transform: translateY(${heightDifference}px)`);
        }
    }

    alterSeatLetters(conf) {
        let lArr = [];
        let sArr = [];

        this.largeSeatConf.forEach(e => {
            lArr.push(this.largeAlphaScaleLtrs.splice(0, e));
        });
        this.smallSeatConf.forEach(e => {
            sArr.push(this.smallAlphaScaleLtrs.splice(0, e));
        });

        lArr.forEach((arr, i) => {
            if (arr.length < conf[i]) {
                if (i + 1 !== lArr.length) {
                    arr.push(sArr[i][conf[i] - 1]);
                } else {
                    if (sArr[i].length === conf[i]) {
                        lArr[i] = sArr[i];
                    } else {
                        arr.unshift(sArr[i][conf[i] - 1]);
                    }
                }
            }
        });
        this.smallAlphaScaleLtrs = [].concat.apply([], sArr);
        this.largeAlphaScaleLtrs = [].concat.apply([], lArr);
    }

    findHeight(seatConf, seatSize) {
        const heightArr = [];
        seatConf.forEach(conf => {
            heightArr.push(conf * seatSize);
        });
        return heightArr;
    }

    drawLopa(deck) {

        const _own = this;
        let clsSeatConfig = [];
        let clsHeightConfig = {
            columns: 0,
            seatSize: 0
        };
        this.noSeatsCountOnDeck = [];
        this.previousScalePoint = 0;
        this.currentScalePoint = 0;
        this.classConfig = [];
        this.cabinClsConf = [];
        this.seatLayoutConfig.x = 0;
        this.largeAlphaScaleLtrs = [];
        this.smallAlphaScaleLtrs = [];
        this.largeSeatConf = [];
        this.smallSeatConf = [];
        this.isLavatoriesAndGalleysExist = false;
        this.lavatoriesAndGalleys = [];
        this.cabinRowNumHeight = [];
        this.deckHeight = 0;
        this.cabinSeatConf = [];
        this.cabinHeightByBay = [];
        this.cabinHeightSeatSize = '';
        if (deck.lavatoriesAndGalleys && deck.lavatoriesAndGalleys.length) {
            this.isLavatoriesAndGalleysExist = true;
            this.lavatoriesAndGalleys = deck.lavatoriesAndGalleys;
        }

        deck.cabinClassConfig.forEach(classObj => {

            clsSeatConfig = classObj.seatConfig.split('-').map(col => parseInt(col));
            const col = clsSeatConfig.reduce((tot, val) => tot + val);

            // To find deck height
            const seatSize = classObj.seatType === 'small' ? this.seatSize.smHeight : this.seatSize.lgHeight
            const cabinHeight = col * seatSize;
            const deckHeightPerBay = this.findHeight(clsSeatConfig, seatSize);
            if (this.cabinHeightByBay.length) {
                this.cabinHeightByBay.forEach((data, i) => {
                    this.cabinHeightByBay[i] = this.cabinHeightByBay[i] < deckHeightPerBay[i] ? deckHeightPerBay[i] : this.cabinHeightByBay[i];
                })
            } else {
                this.cabinHeightByBay = deckHeightPerBay;
            }
            if (cabinHeight > this.deckHeight) {
                this.deckHeight = cabinHeight;
                this.cabinHeightSeatSize = classObj.seatType;
            }

            // To find the maximum seat letters for all cabins (seatType === 'large')
            if (classObj.seatType === 'large' &&
                (this.largeAlphaScaleLtrs.length < classObj.seatLetters.split('').length)) {
                this.largeAlphaScaleLtrs = classObj.seatLetters.split('');
                this.largeSeatConf = clsSeatConfig;
            }

            // To find the maximum seat letters for all cabins (seatType === 'small')
            if (classObj.seatType === 'small' &&
                (this.smallAlphaScaleLtrs.length < classObj.seatLetters.split('').length)) {
                this.smallAlphaScaleLtrs = classObj.seatLetters.split('');
                this.smallSeatConf = clsSeatConfig;
            }

            this.seatLayoutConfig.x = this.seatLayoutConfig.x + (classObj.endRow - classObj.startRow + 1);

            this.cabinClsConf.push({
                cabin: classObj.cabinClass,
                letters: classObj.seatLetters.split(''),
                seatConf: clsSeatConfig,
                seatType: classObj.seatType
            });

            if (this.cabinRowNumHeight.length) {
                clsSeatConfig.forEach((seatNo, i) => {
                    const seatlayHgt = seatNo * (classObj.seatType === 'small' ? this.seatSize.smHeight : this.seatSize.lgHeight);
                    this.cabinRowNumHeight[i] = this.cabinRowNumHeight[i] < seatlayHgt ? seatlayHgt : this.cabinRowNumHeight[i];
                });
            } else {
                clsSeatConfig.forEach((seatNo, i) => {
                    const seatlayHgt = seatNo * (classObj.seatType === 'small' ? this.seatSize.smHeight : this.seatSize.lgHeight);
                    this.cabinRowNumHeight.push(seatlayHgt);
                });
            }
            classObj['noSeatRows'] = [];
            if (classObj.noSeats.length) {
                const clsLtrsLength = classObj.seatLetters.split('').length;
                for (let i = classObj.startRow; i <= classObj.endRow; i++) {
                    const noSeats = [];
                    classObj.noSeats.forEach(seat => {
                        if (i === parseInt(seat.replace(/\'/g, '').split(/(\d+)/).filter(Boolean)[0])) {
                            noSeats.push(seat);
                        }
                    });
                    if (noSeats.length === clsLtrsLength) {
                        classObj['noSeatRows'].push(i);
                    }
                }
                this.noSeatsCountOnDeck = [...classObj.noSeatRows];
            }

            if (clsHeightConfig.columns < col) {
                clsHeightConfig.columns = col;
                clsHeightConfig.seatSize = classObj.seatType === 'small' ? this.seatSize.smHeight : this.seatSize.lgHeight;
                this.seatLayoutConfig.y = clsSeatConfig;
            }
            this.classConfig[classObj.cabinClassOrder - 1] = classObj;
        });

        this.cabinClsConf.forEach(conf => {
            if (conf.seatType === 'large') {
                if (conf.seatConf.length > 2 && this.largeAlphaScaleLtrs.length <= 7 &&
                    conf.letters.length < 6 && this.smallAlphaScaleLtrs.length >= 7) {
                    conf.seatConf = [2, 2, 2];
                    if (this.largeAlphaScaleLtrs.length < 6) {
                        this.alterSeatLetters(conf.seatConf);
                    }
                } else {
                    conf.seatConf = this.largeSeatConf;
                }
            }
        });

        clsHeightConfig.columns = this.seatLayoutConfig.y.reduce((tot, val) => tot + val);

        const lavAndGalleyLength = this.isLavatoriesAndGalleysExist ? this.lavatoriesAndGalleys.length : 0;
        this.chartSize = {
            width: (lavAndGalleyLength * 20) + (this.classConfig.length * this.padding.inner) + 
            (this.seatSize.width * this.seatLayoutConfig.x) - (this.noSeatsCountOnDeck.length * this.seatSize.width),
            height: this.calcHeight()
        };

        const lopaChart = this.chartWrapper
            .append('div')
            .classed(`lopa-chart-${deck.deckName} deck-wrapper`, true);

        if (this.showDeckName) {
            this.deckNameDisplay = lopaChart
                .append('div')
                .classed('deck-name', true)
                .text(deck.deckName);
        }

        this.cabinName = lopaChart
            .append('div')
            .classed('lopa-cabin-name', true);

        this.svg = lopaChart
            .append('svg')
            .attr('width', _own.chartSize.width)
            .attr('height', _own.chartSize.height);

        this.svg.call(_own.tool_tip);
        this.drawSeats(deck);
    }

    getLaventoriesGalleries(col, lavArr) {

        let index = 0;
        lavArr.length && lavArr.forEach((num, i) => {
            if (num <= col) {
                index = i + 1;
            }
        });
        return index;
    }

    laventoriesCabinCount(start, end) {
        let index = 0;
        this.isLavatoriesAndGalleysExist && this.lavatoriesAndGalleys.forEach(num => {
            if (start <= num && num <= end) {
                ++index;
            }
        });
        return index;
    }

    renderSeats(cls, seatData, deckName) {

        const _own = this;
        let seatW = this.seatSize.width;
        let seatH = cls.cabin.seatType === 'small' ? this.seatSize.smHeight : this.seatSize.lgHeight;
        let rectW = seatW - 4;
        let rectH = seatH - 4;

        const deck = deckName.split(' ').join('').toLowerCase();
        const className = cls.cabin.cabinClass.split(' ').join('').toLowerCase();
        const deckClassname = `${deck}${className}`.replace(/[^a-zA-Z0-9]/g, '-');
        const height = this.showCabinName ? this.chartSize.height - 40 : this.chartSize.height;
        let lavArr = [];

        if (this.isLavatoriesAndGalleysExist) {
            lavArr = [...this.lavatoriesAndGalleys];
            for (let i = lavArr.length - 1; i >= 0; --i) {
                if (cls.cabin.startRow > lavArr[i] || lavArr[i] > cls.cabin.endRow) {
                    lavArr.splice(i, 1);
                }
            }
            lavArr.sort((a, b) => a - b);
        }

        this.cabinClsSeatLtrs = [];
        const ltrsArr = cls.cabin.seatLetters.split('');
        cls.cabin.seatConfig.split('-').forEach((num, i) => {
            this.cabinClsSeatLtrs[i] = ltrsArr.splice(0, num);
        });
        this.alphaScaleLtrs = cls.seatConf;
        this.xAxis(this.currentScalePoint + 5, cls.cabin.cabinClass, lavArr);
        this.yAxis(cls.seatConf, seatH);

        const cabinLavCount = this.isLavatoriesAndGalleysExist ? this.laventoriesCabinCount(cls.cabin.startRow, cls.cabin.endRow) : 0;

        if (this.showCabinName) {
            this.cabinName.append('div')
                .classed('cabin-class-name', true)
                .html(`<span>${cls.cabin.cabinClass}</span>`)
                .attr('style', d => {
                    return `transform: translate(${_own.currentScalePoint + _own.padding.inner + 5}px, 15px);
                        width: ${(_own.numData.length * seatW) + (cabinLavCount * 20)}px;
                        display: inline;`;
                });
        }

        const clsG = this.svg.append('g')
            .classed(`cabin ${deckClassname}`, true);

        this.numData.forEach((col, i) => {
            clsG.selectAll('g')
                .data(cls.seatConf)
                .enter()
                .append('path')
                .attr('class', d => `default ${d}${col}`)
                .attr('id', d => `${col}${d}`)
                .attr('d', _own.roundedPath(-(rectW / 2), -(rectH / 2), rectW, rectH, 7))
                .attr('transform', d => {
                    const lavIndex = this.getLaventoriesGalleries(col, lavArr);
                    _own.previousScalePoint = _own.currentScalePoint + (lavIndex * 20) + ((i + 1) * seatW);
                    const cabinHeight = _own.detectCabinHeight(d);
                    const cabinPositionHeight = this.alterSeatPosition(d);
                    const seatLetterIndex = cls.seatConf.findIndex(seat => seat === d);
                    return `translate(${_own.currentScalePoint + (lavIndex * 20) + ((i + 1) * seatW)}, 
                    ${height - cabinPositionHeight - cabinHeight - ((seatLetterIndex + 1) * seatH) - _own.detectPadding(d) + cls.topPos})`
                })
                .attr('style', d => {
                    const seatNo = `${col}${d}`;
                    let color = '#e4e4e4';
                    let border = 'none';
                    seatData.forEach(data => {
                        if (data.seat === seatNo) {
                            color = data.backgroundColor ? data.backgroundColor : color;
                            border = data.outlineColor ? data.outlineColor : border;
                        }
                    });
                    const display = cls.cabin.noSeats.includes(seatNo) ? 'none' : 'inline';
                    return `display: ${display}; fill: ${color}; stroke: ${border}; stroke-width: 2;`;
                })
                .on('click', d => {
                    if (_own.options.onSelect && typeof _own.options.onSelect === "function") {
                        _own.options.onSelect(`${col}${d}`);
                    }
                    if (_own.options.selectable) {
                        _own.select(`${col}${d}`);
                    }
                })
                .on('mouseover', d => {
                    if (_own.options.onMouseOver && typeof _own.options.onMouseOver === "function") {
                        _own.options.onMouseOver(`${col}${d}`);
                    }

                    if (_own.options.hoverable) {
                        _own.highlight(`${col}${d}`);
                    }

                    seatData.forEach(data => {
                        if (data.seat === `${col}${d}`) {
                            _own.tool_tip.show(data.tooltip);
                        }
                    });
                })
                .on('mouseout', d => {
                    document.querySelectorAll('.element-hover').forEach(ele => ele.classList.remove('element-hover'));
                    _own.tool_tip.hide();
                });
        });

        this.deckNameW = this.deckNameW + d3.select(`.${deckClassname}`).node().getBBox().width;
        this.currentScalePoint = this.previousScalePoint + this.padding.inner;
    }

    drawSeats(deck) {

        const _own = this;
        this.deckNameW = 0;
        this.clsCabinHeight = 0;
        this.airCraftHeight.push({
            deckName: deck.deckName,
            height: this.chartSize.height
        });
        this.classConfig.forEach(cls => {
            let cabinConf = {};
            const seatSize = cls.seatType === 'small' ? this.seatSize.smHeight : this.seatSize.lgHeight;
            const clsSeatConfig = cls.seatConfig.split('-');
            const col = clsSeatConfig.reduce((tot, val) => tot + val);
            this.clsCabinHeight = col * seatSize;
            if (this.cabinHeightSeatSize === 'small' && cls.seatType === 'large') {
                this.clsCabinHeight += 0
            }
            this.currentCabinHeight = this.findHeight(clsSeatConfig, seatSize);
            this.currentCabin = {
                alpha: cls.seatLetters,
                conf: clsSeatConfig
            };
            
            this.initiateScales(cls, cls.seatType === 'large' ? this.largeAlphaScaleLtrs : this.smallAlphaScaleLtrs);

            if (cls.seatType === 'small') {
                cabinConf = {
                    topPos: 5,
                    yAxis: 32
                };
            } else {
                cabinConf = {
                    topPos: 12,
                    yAxis: 25
                };
            }

            cabinConf.seatConf = cls.seatLetters.split('');
            cabinConf.cabin = cls;

            this.renderSeats(cabinConf, deck.data ? deck.data : [], deck.deckName);
        });

        // To display seat data (reset count)
        if (deck.data && deck.data.length) {
            let text = this.svg.append('g')
                .classed('seat-count', true);

            text.selectAll('text')
                .data(deck.data)
                .enter()
                .append('text')
                .attr("x", _own.findXPos.bind(_own))
                .attr("dy", _own.findYPos.bind(_own))
                .append('textPath')
                .attr("xlink:href", d => `#${d.seat}`)
                .text(d => d.value)
                .attr('style', d => `font-size: 11px; fill: ${d.foregroundColor}`)
                .on('click', d => {
                    if (_own.options.onSelect && typeof _own.options.onSelect === "function") {
                        _own.options.onSelect(d.seat);
                    }
                    if (_own.options.selectable) {
                        _own.select(d.seat);
                    }
                })
                .on('mouseover', d => {
                    if (_own.options.onMouseOver && typeof _own.options.onMouseOver === "function") {
                        this.options.onMouseOver(d.seat);
                    }
                    if (_own.options.hoverable) {
                        _own.highlight(d.seat);
                    }
                    _own.tool_tip.show(d.tooltip);
                })
                .on('mouseout', d => {
                    document.querySelectorAll('.element-hover').forEach(ele => ele.classList.remove('element-hover'));
                    _own.tool_tip.hide();
                });
        }

        // To display deckName 
        if (this.deckNameDisplay) {
            this.deckNameDisplay.attr('style', `width:${this.deckNameW + (this.classConfig.length * this.padding.inner)}px;`)
        }
    }
}