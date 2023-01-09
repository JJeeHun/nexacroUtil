# sfw.json
- nexacro에 javascript 라이브러리를 올리는 json 정보 (runtime 용)
- web에 추가시 jsp를 사용하면 따로 라이브러리를 추가해줘야한다.
- nexacro 기본 index.html을 사용시는 자동으로 추가됨.

# util > nexacro의 기능을 object 형태로 get ,set 시킬 수 있도록 추가 기능

# UtilInterface -> 기능들을 모아둔 interface 처럼 사용

## impl/* 기능 구현체들

## !!중요
### ******* ServiceUtil은 gfn_service를 사용하기 때문에 해당 함수를 사용하지 않는 nexacro 프로젝트에서는 사용불가 *******

## 나머지 기능들은 nexacro 기본 기능으로 만들었기 때문에 사용가능(nexacro N 이상) - es6 문법을 사용

## JsonTransaction -> nexacro transaction 을 사용하지 않고 XMLHttprequest 사용 했기때문에 스프링부트에서 get,post,patch,put,delete method 사용가능
- JsonTransaction 안에 json -> dataset으로 변경하는 로직이 같이 들어있음.