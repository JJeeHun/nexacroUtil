/************************************* 의존성 없는 객체 *************************************/
/**
 * nexacroQueryString -> query String 형태로 변환 로직 (구글 주어온 로직)
 * @param {Object} queryObject 
 * @param {?} key 
 * @param {?} list 
 * @returns
 * @desc 추후 교체 가능하게 function 화 시킴
 */
function getQueryUrl(url ,queryObject){
    
    //넥사크로 런타임용 쿼리스트링 function
    const nexacroQueryString = (queryObject ,key ,aList) => {
        const list = aList || [];

        if(typeof(queryObject)=='object'){
            Object.keys(queryObject).forEach( idx => nexacroQueryString(queryObject[idx] ,key?key+'['+idx+']':idx ,list));
        } else {
            list.push(key+'='+encodeURIComponent(queryObject));
        }
        
        return list.join('&');
    }

    //브라우저용 쿼리스트링 function
    const browserUrl = (url ,queryObject) => {
        const sUrl = new URL(url);

        //query string add
        Object.keys(queryObject).forEach( key => sUrl.searchParams.set(key ,queryObject[key]) );

        return sUrl;
    }

    //실행
    if(typeof url == 'string') return url += '?' + nexacroQueryString(queryObject); //넥사용
    else return browserUrl(url ,queryObject); //브라우저용
}


/**
 * JSON 형태의 데이터를 Dataset 으로 변환한다.
 * @param {nexacro.Dataset} ds 
 * @param {Array Or Object} list 
 * @desc - json data를 dataset 으로 변환
 */
function JsonToDataset( ds ,list ) {
    /********** Variable Area **********/
    const isArray = Array.isArray(list);                                //list가 아니면 object(단건) 확인용
    const keys    = isArray ? Object.keys(list[0]) : Object.keys(list); //keys list == column list


    /********** function Area **********/
    //column Info
    const getColumnInfo = () => `<ColumnInfo>${keys.map( key => `<Column id="${key}" type="STRING" size="255" />`).join('')}</ColumnInfo>`;
    //row list
    const getRows = () => list.map( row => getRow(row)).join('');
    //first row
    const getRow = (row) => '<Row>'+Object.keys(row).map( key => `<Col id="${key}">${row[key] || ''}</Col>`).join('')+'</Row>';


    /********** Runnable Area **********/
    const rows      = isArray ? getRows() : getRow(list);
    const saveXML   = getColumnInfo() + `<Rows>${rows}</Rows>` ;
    
    //json -> dataset xml format을 dataset의 주입
    ds.set_enableevent(false);
    ds.loadXML(saveXML);	
	ds.set_enableevent(true);
}


/************************************* 의존성 있는 객체 *************************************/
/**
 * 제이쿼리의 ajax 같은 함수
 * @param {Object} obj 
 * @returns new Promise()
 * @desc - obj 정보 -> url(필수) ,method(:GET) ,async(:true) ,data(:{}) ,headers(:{})
 */
function JsonTransactionCall(obj) {
    let url    = obj.url; //'http://localhost:9091/SFD2022v1/test/01.nx'; //url 설정 기본 path 잡아줘야함
    
    //url 패턴 validation 로직 필요하면 추가
    if(!url) throw new Error('url이 존재하지 않습니다.');

    /********** Variable Area **********/
    const xhr     = new XMLHttpRequest(); //통신객체 생성
    const method  = typeof obj.method == 'string' && obj.method ? obj.method.toUpperCase() : 'GET';
    const async   = obj.async   || true;
    const data    = obj.data    || {};
    const headers = obj.headers || {};
    
    //GET 방식일 경우 쿼리 url에 쿼리스트링을 붙여서 전달
    if(method == 'GET') url = getQueryUrl(url ,data);


    /********** function Area **********/
    //open 후 setting 가능
    const setHeader = (headerOption) => Object.keys(headerOption).forEach(key => xhr.setRequestHeader(key ,headerOption[key]));

    //통신 완료시 result data를 만드는 함수
    const getResult = () => {
        let data = xhr.response || xhr.responseText || '';
        
        //parse시 error가 나면 그냥 넘겨줌
        try { data = JSON.parse(data); }
        catch(e){}
        
        const response = {
             data
            ,status : xhr.status
            ,JsonToDataset
        };

        return response;
    }

    //실행 함수
    const run = () => {
        //전달 객체 설정
        xhr.open(method ,url ,async);

        //get이 아닐 경우 json이 기본 - setting 후 초기화
        if(method != 'GET') xhr.setRequestHeader('Content-Type' ,'application/json');

        //open 후 header setting 됨
        setHeader(headers);

        //통신시 필요한 header setting 후 body를 return 받아서 처리
        xhr.send(JSON.stringify(data));
    }
    

    /********** Runnable Area **********/

    //실행에 필요한 데이터 셋팅 후 트랜잭션처리
    run();
    

    /********** Return **********/

    //Promise를 return 한다
    return new Promise((resolve ,reject) => {
        //통신 완료시 실행 함수
        xhr.onreadystatechange = function() {
            //처리완료
            if (xhr.readyState == 4) {    
                const customResponse = getResult();
                const errorList      = [403,404,500]; //403(Forbidden - 접근거부) ,404(Not Found - 페이지 없음) ,500(Internal Server Error - 서버 오류 발생)

                //if => 정상 , else if => 정상이 아닐 경우 loop 안돌게 else if로 처리 (추후 코드 상태에 따라서 로직 변경)
                if(xhr.status == 200) resolve(customResponse);
                else if( errorList.find( errorCode => errorCode == xhr.status) ) reject(customResponse);
            }//end if
        };
    });    
}


/**
 * 트랜잭션 call 후 dataset을 자동 convert 하고 promise를 return 해준다.
 * @param {nexacro.Dataset} ds 
 * @param {transaction info} obj 
 * @returns 
 */
function TestDatasetTransaction( ds ,obj ) {
    const defaultUrl = 'http://localhost:9091/SFD2022v1';

    if(obj.url.indexOf('/') != 0) obj.url = defaultUrl + '/' +obj.url;
    else obj.url = defaultUrl + obj.url;

    return JsonTransactionCall(obj).then((res) => {
        var {data ,JsonToDataset} = res;
        JsonToDataset( ds ,data );
        return res;
    });
}