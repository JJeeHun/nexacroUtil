/**
 * 자주 사용하는 그리드 기능을 util화 시킴
 * @param {nexacro.Grid} grid
 * @desc 그리드 속성 변경중 edittype 기능 추가
 * @desc edittype이 'i','insert' 등 설정값일 경우 dataset의 상태값이 해당 상태값일 경우만 활성화됨.(그리드에는 사용 edittype 값을 적용)
 */
function GridUtilClass(grid) {
    let errorLoc;
    const GRID = grid;
    const GRID_FORMAT = { origin: GRID.getCurFormatString(false) ,setProps : GRID.getCurFormatString(false) };
    const STATE_INFO = {
         INSERT : ['i','I','insert',Dataset.ROWTYPE_INSERT]
        ,UPDATE : ['u','U','update',Dataset.ROWTYPE_UPDATE]
    }

    const getThrowMsg = (msg) => `Error function name ${msg} :: `;

    const addCol = (addCnt) => {
        GRID.set_enableredraw(false);
        const emptyColIndex = new Array(addCnt || 1).fill(0);
        const resultColIndex = emptyColIndex.map(empty => GRID.appendContentsCol('body'));
        GRID.set_enableredraw(true);
        return resultColIndex;
    }

    const getState = (state) => {
        for(const STATE in STATE_INFO) {
            if(STATE_INFO[STATE].find((stateVal) => stateVal == state)) {
                return STATE;
            };
        }
    }

    const setProps = (loc,obj) => {
        for(const column_id in obj) {
            const props = obj[column_id];            
            setProp(loc,column_id,props);
        }
    }

    const setProp = (loc ,id ,props) => {
        const cellIndex = isNaN(Number(id)) ? GRID.getBindCellIndex('body',id) : id;
        
        if(cellIndex < 0) throw new Error(errorLoc + id + '이(가) 존재하지 않습니다.');

        for(const prop in props) {
            let val = props[prop];
            let state;

            if(prop != 'edittype' && typeof val != 'string') throw new Error(`${errorLoc} error prop -> ${prop}의 property의 값이 string이 아닙니다.`);
            if(prop == 'edittype' &&  (state = getState(val)) ) {
                const oEdittype = GRID.getCellProperty(loc,cellIndex,prop);
                
                if(oEdittype == 'none') throw new Error(`${errorLoc} edittype의 기본값이 셋팅되지 않았습니다.`);
                val = `expr:dataset.getRowType(currow) != Dataset.ROWTYPE_${state} ? "none" : "${oEdittype}"`;
            }
            
            GRID.setCellProperty(loc,cellIndex,prop,val);
        }

        GRID_FORMAT.setProps = GRID.getCurFormatString(false);
    }

    const setStateExpr = (state ,id ,props) => {
        const cellIndex = isNaN(Number(id)) ? GRID.getBindCellIndex('body',id) : id;
        const findState = getState(state);
        
        if(cellIndex < 0) throw new Error(errorLoc + id + '이(가) 존재하지 않습니다.');

        for(const prop in props) {
            let val = props[prop];

            if( typeof val != 'string' ) throw new Error(`${errorLoc} error prop -> ${prop}의 property의 값이 string이 아닙니다.`);
            if( findState ) {
                const oProp = GRID.getCellProperty('body',cellIndex,prop);
                val = `expr:dataset.getRowType(currow) == Dataset.ROWTYPE_${findState} ? "${val}" : "${oProp}"`;
            }
            GRID.setCellProperty('body',cellIndex,prop,val);
        }
    }

    /**
     * 그리드이 id 값을 반환
     * @returns {string}
     */
    this.getGridId    = () => GRID.id;

    /**
     * 그리드를 초기값으로 변경
     * @param {boolean} is - true면 property를 변경한 format으로 변경
     * @returns {string}
     */
    this.init         = (is) => GRID.set_formats(GRID_FORMAT[!is ? 'origin' : 'setProps']);

    /**
     * 그리드의 열을 추가
     * @param {Number} addCnt 
     * @returns {Array[Numbers]}
     */
    this.addCol       = (addCnt) => addCol(addCnt);

    /**
     * 그리드의 index OR 바인드 되어있는 id 값을 기준으로 속성변경
     * @param {string OR Number} id 
     * @param {Object} prop 
     * @returns GridUtilClass
     * @desc setHeadProp('column_name', {edittype : 'none',displaytype:'text'....} ) - 그리드의 속성명으로 접근
     */
    this.setHeadProp  = function(id ,prop) {
        errorLoc = getThrowMsg('setHeadProp');
        setProp('head',id ,prop);
        return this;
    }
    this.setBodyProp  = function(id ,prop) {
        errorLoc = getThrowMsg('setBodyProp');
        setProp('body' ,id ,prop);
        return this;
    }

    /**
     * 데이터셋의 상태의 따라서 처리할 id의 property
     * @param {string OR number} state 
     * @param {string OR number} id 
     * @param {Object} prop 
     */
    this.setStateExpr = function(state ,id ,prop) {
        errorLoc = getThrowMsg('setStateExpr');
        setStateExpr(state ,id ,prop);
        return this;
    }
    this.setStateExprs = function(state ,obj) {
        errorLoc = getThrowMsg('setStateExprs');
        for(const column_id in obj) {
            const props = obj[column_id];            
            setStateExpr(state ,column_id ,props);
        }
        return this;
    }

    /**
     * 그리드의 속성을 한번에 변경
     * @param {Object} props
     * @desc setHeadProps({ column_name1 : {edittype : 'none',displaytype:'text'....} ,column_name2 : {edittype : 'none',displaytype:'text'....} } )
     */
    this.setHeadProps  = function(props) {
        errorLoc = getThrowMsg('setHeadProps');
        setProps('head' ,props);
        return this;
    }
    this.setBodyProps  = function(props) {
        errorLoc = getThrowMsg('setBodyProps');
        setProps('body' ,props);
        return this;
    }

}
