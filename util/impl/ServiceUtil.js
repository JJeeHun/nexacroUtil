//service = datasetUtilBuilder의 구조체 service를 따라간다.
function ServiceUtilClass( aForm ,aUtil ,aDatasetName ,aService ) {
    const DATASET_NAME  = aDatasetName;
    const CONST_INFO    = Object.freeze({search:'url', save:'url.save', searchProc:'procedure', saveProc:'procedure.save'});
    const SERVICE       = Object.freeze(aService);
    const PROCEDURE     = Object.freeze(aService.procedureInfo);
    const LABEL_INFO    = { select:'조회되었습니다' ,save:'저장되었습니다' }; //추후 builder에서 option으로 받을 수 있도록 처리
    let prevType ,options = { isPositionMemory: false };
    
    /**
     *  private function
     */

    //service에 Success 함수 추가
    const setOnSuccess = (service ,callback ,callInfo ,labelType) => {
        service.callback.onsuccess = function(info,status) {//proxy function
            //info = gfn_save , gfn_search 실행시 넣어줌
            if(!callback) 
                SERVICE.success.call( aForm ,aUtil );
            else {                        
                callback.call( aForm ,aUtil , callInfo);
            }

            //공통으로 처리
            aUtil.reloadLabel();//aUtil 클래스 의존 - 레이블 리로드
            
            if(setTransactionCheck(labelType)) layout.bottom.form.fn_SetBottomMsg(LABEL_INFO[labelType]);//bottom 메시지 변경
        }
    }

    //저장 후 3초(bottom에서 설정한 timer 시간)안에 search가 실행 되었을 경우 msg를 안바꾼다.
    const setTransactionCheck = (labelType) => {
        if(labelType == 'save') {
            prevType = labelType;             
            return true;
        }
        
        if(labelType == 'select') {            
            const is = prevType != 'save';
                       prevType = '';//초기화
            return is;//이전 실행 type이 save면 message 미출력
        }
    }

    //service에 Failed 함수 추가
    const setOnFailed = (service ,callInfo) => {
        service.callback.onfailed = function(service_object, error_code, error_message) {
            //return 정보를 success와 통일 하기 위함 -> 추후 success에서도 같은 형태를 최대한 유지
            callInfo.service = service_object;
            callInfo.code    = error_code;
            callInfo.message = error_message;
            //fail 함수 호출
            SERVICE.fail.call( aForm ,aUtil ,callInfo);
        }
    };

    //save로직시 validate 추가
    const setValidate = (service) => {
        service[DATASET_NAME] = { 
             validate : SERVICE.validate 
            ,validator: SERVICE.validator 
        }
        return 'save';
    }

    //service type에 따라 Object return
    const getService = function(type,params,callback) {
        if(!type) throw new Error('type이 존재하지 않습니다. $ type : url ,url.save ,procedure ,procedure.save 중 입력하세요');
    
        var labelType = 'select';//기본값        
        var callInfo = {success: SERVICE.success.bind(aForm) ,fail: SERVICE.fail.bind(aForm)}; //onSuccess와 onFailed의 구조 통일화 info 객체

        //init service
        var service = {
            [DATASET_NAME]: { params: {} }
           ,callback: {}
        };

        //fail callback 추가시 proxy function
        if(SERVICE.fail) setOnFailed(service ,callInfo);

        //행기억
        if(SERVICE.positionMemory.length > 0)  {//포지션 기억 처리 어떻게 할지 확인 후 -options.isPositionMemory == true && SERVICE.positionMemory.length > 0
            service[DATASET_NAME].row = { cols: SERVICE.positionMemory };
            options.isPositionMemory = false;//다음 로직에 영향안가게 false 처리
        }

        //url setting
        if(type.includes(CONST_INFO.search))    service.url = SERVICE.url;
        if(type.includes(CONST_INFO.save))      labelType = setValidate(service);
        
        //procedure setting
        if(type == CONST_INFO.searchProc)       service[DATASET_NAME].sql = { type :'P' ,procedure : PROCEDURE.sel  };
        if(type == CONST_INFO.saveProc)         {
            labelType = setValidate(service);
            service[DATASET_NAME].sql =  Object.assign( {type : 'P'} ,PROCEDURE) 
        };

        //파라미터 존재시 주입
        if(typeof params == 'object') service[DATASET_NAME].params = params;
        
        //service success function 주입
        setOnSuccess(service ,callback ,callInfo ,labelType);

       return service;
    }

    // return Object -> 함수명에 맞게 구현체를 return
    const getUrlService = function(type ,url ,params ,callback) {
        var service     = getService(type ,params ,callback);
            service.url = SERVICE.url+url;
        return service;
    }
    const getProcService = function(type ,params ,callback) {    
        return getService(type ,params ,callback);
    }
    const setUrlChain = (type,chain,url,params,callback) => {
        chain.setService(getUrlService(type,url,params,callback));
    }
    const setProcChain = (type,chain,params,callback) => {
        chain.setService(getProcService(type,params,callback));
    }


    /**
     *  public function
     */
    //실행 객체
    //param1 의 인스턴스가 ServiceChainClass 일 경우 체인 객체의 setter에 주입
    this.search = (param1,param2,param3,param4) => {//url ,params , callback => chain ,url ,params ,callback
        const type = CONST_INFO.search;

        if(param1 instanceof ServiceChainClass) return setUrlChain(type,param1,param2,param3,param4);

        var service = getUrlService(type,param1,param2,param3);

        aForm.gfn_search(service);
    }
    

    this.save = (param1,param2,param3,param4) => {
        const type = CONST_INFO.save;

        if(param1 instanceof ServiceChainClass) return setUrlChain(type,param1,param2,param3,param4);

        var service = getUrlService(type,param1,param2,param3);

        aForm.gfn_save(service);
    }


    //params , callback => chain ,params ,callback
    this.searchProc = (param1,param2,param3) => {  
        const type = CONST_INFO.searchProc;

        if(param1 instanceof ServiceChainClass) return setProcChain(type,param1,param2,param3);

        var service = getProcService(type,param1,param2);

        aForm.gfn_search(service);
    }

    this.saveProc = (param1,param2,param3) => {
        const type = CONST_INFO.saveProc;

        if(param1 instanceof ServiceChainClass)  return setProcChain(type,param1,param2,param3);

        var service = getProcService(type,param1,param2);

        aForm.gfn_save(service);
    };

    this.exec = (options ,callback) => {        
        const procInfo = {insert:'ins' ,update:'upd' ,select:'sel' ,delete:'del'};
        const service = getService('exec',{},callback);//더미 service
        
        //dataset property 삭제
        delete service[DATASET_NAME];

        //service를 기준으로 options 복사(우선순위 options)
        var newService = Object.assign(service ,options);

        //setting 되어있는 프로시저가 있을 경우
        var initProc = PROCEDURE[procInfo[options.procedure]];
        if(initProc) {
            delete newService.procedure;
            newService.sql = {type: 'P' ,procedure: initProc};
        }

        aForm.gfn_exec(newService);
    }

    //option 속성
    this.isPositionMemory = function() {
        options.isPositionMemory = true;
        return this;
    }
}





/**
 * service 묶어서 날릴수 있도록하는 객체 
 * @param {nexacro.Form} aForm 
 * @function setService setter
 * @function setIndividualCallback close setter => service마다의 callback을 실행 => 해당 함수 사용 후 setter 잠김
 * @function search runnable => service 실행
 * @function save   runnable => service 실행
 */
function ServiceChainClass(aForm) {
    const cashCallback = [];
    let services = {};
    let isEnd = false;
    
    this.setService = (service) => {
        if(isEnd) throw new Error('function Name : setService  - 서비스를 추가 할 수 없습니다.');

        cashCallback.push(service.callback);
        services = Object.assign(services, service);
    };

    // 개별 callback 처리
    this.setIndividualCallback  = () => {
        if(isEnd) throw new Error('function Name : setIndividualCallback - 해당 함수를 더이상 실행 할 수 없습니다.');
            isEnd = true;

        //등록한 callback을 각각 실행하기 위한 proxy function
        services.callback = {
            onsuccess : function(info,status) {
                cashCallback.forEach( (callback) => {
                    callback.onsuccess.call(aForm,info,status);
                });
            }
        }
        return this;
    }

    this.search = () => {aForm.gfn_search(services)}
    this.save   = () => {aForm.gfn_save(services)}
}