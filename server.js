// 설치한것을 불러들여 그 안의 함수 명령어들을 쓰기위해 변수로 세팅
const express = require("express");
// 데이터베이스의 데이터 입력, 출력을 위한 함수명령어 불러들이는 작업
const MongoClient = require("mongodb").MongoClient;
// 시간 관련된 데이터 받아오기위한 moment라이브러리 사용(함수)
const moment = require("moment");
const app = express();

// 포트번호 변수로 세팅
const port = process.env.PORT || 8000;

//a


// ejs 태그를 사용하기 위한 세팅
app.set("view engine","ejs");
// 사용자가 입력한 데이터값을 주소로 통해서 전달되는 것을 변환(parsing)
app.use(express.urlencoded({extended: true}));
// css나 img, js와 같은 정적인 파일 사용하려면 ↓ 하단의 코드를 작성해야한다.
app.use(express.static('public'));

// Mongodb 데이터 베이스 연결작업
// 데이터베이스 연결을 위한 변수 세팅 (변수의 이름은 자유롭게 지어도 ok)
let db;
// Mongodb에서 데이터베이스를 만들고 데이터베이스 클릭 → connect → Connect your application → 주소 복사, password에는 데이터베이스 만들때 썼었던 비밀번호를 입력해 준다.
MongoClient.connect("mongodb+srv://admin:qwer1234@testdb.g2xxxrk.mongodb.net/?retryWrites=true&w=majority",function(err,result){
    // 에러가 발생했을 경우 메세지 출력 (선택사항임. 안쓴다고 해서 문제가 되지는 않는다.)
    if(err){ return console.log(err);}

    // 위에서 만든 db변수에 최종적으로 연결 / ()안에는 mongodb atlas에서 생성한 데이터 베이스 이름 집어넣기
    db = result.db("testdb");

    // db연결이 제대로 되었다면 서버 실행
    app.listen(port,function(){
        console.log("서버연결 성공");
    });
});




// 메인페이지 요청 경로
app.get("/",function(req,res){
    res.send("메인페이지");
});

// 글 목록페이지 경로
app.get("/list",function(req,res){
    // 데이터베이스에서 게시글관련 데이터들 꺼내서 갖고온후 brd_list.ejs 전달

    // find함수 사용시 뒤에다 붙여서 사용할 수 있는 함수들
    // sort({컬렉션 안에서 어떤 항목을 나타낼것인가:-1})
    // 정렬
    // 게시판 순서가 내림차순이(1 → 100) 아닌 올림차순(100 → 1)인 역순으로 나오게 하는 함수 명령어
    // limit(숫자)
    // 갯수제한
    // 게시글이 많아지면 일정 수의 게시물만 보여지게 하고 그 다음페이지로 가야 그 다음의 일정 수 게시물만 보여지도록 하는 명령어
    // 위와 같은 페이징? 작업시 사용된다.
    // skip ()
    // 가지고 온 데이터들 중에서 몇개를 생략하고 나머지를 출력할 때 사용하는 함수 명령어
    db.collection("ex8_board").find().sort({brdid:1}).toArray(function(err,result){
        res.render("brd_list",{data:result});
    });
});

// 글쓰기 페이지 경로
app.get("/insert",function(req,res){
    res.render("brd_insert");
});

//db에 글 입력처리
app.post("/add",function(req,res){
    // moment 사용해서 날짜 보여주는 작업
    let date = moment().format("YYYY-MM-DD HH:mm")

    db.collection("ex8_count").findOne({name:"게시판"},function(err,result){
        db.collection("ex8_board").insertOne({
            brdid:result.totalCount+1,
            brdtitle:req.body.title,
            brdcontext:req.body.context,
            brdauther:req.body.auther,
            brddate:date,
            // 조회수 작업
            brdviews:0
        },function(err,result){
            db.collection("ex8_count").updateOne({name:"게시판"},{$inc:{totalCount:1}},function(err,result){
                res.redirect("/list");
            });
        });
    });
});


// 테스트
// url주소에 get요청으로 보내준 데이터값 확인
// app.get("/search",function(req,res){
//     // db에 있는 ex8_board 컬렉션에 접근해서 해당 단어에 맞는 게시글 관련 객체들만 꺼내올것
//     // find(), findOne() 함수는 해당 컬렉션에 있는 데이터와 정확하게 일치하는 것들만 찾아온다.
//     db.collection("ex8_board").find({brdtitle:req.query.searchResult}).toArray(function(err,result){
//         console.log(result);
//         res.send("검색완료");
//     });

// });
app.get("/search",function(req,res){

// db에서 가져온 코드 붙여넣기
let test = [
        {
          $search: {
            index: 'searchtest',
            text: {
              query: req.query.searchResult,
              path: req.query.searchCategory
            }
          }
        },
        // 필요한 옵션 추가로 넣을 수 있음
        // 이때 들어가는 옵션은 객체의 형식으로 들어간다.
        {
          $sort:{brdid:-1}
        },
        // {
        //   $limit:10
        // }
      ]

    // db에 있는 ex8_board 컬렉션에 접근해서 해당 단어에 맞는 게시글 관련 객체들만 꺼내올것
    db.collection("ex8_board").aggregate(test).toArray(function(err,result){
        res.render("brd_list",{data:result});
    });

});

// 상세페이지 경로
app.get("/detail/:no",function(req,res){
    // req.params.no  <--- 변수명 위에꺼랑 똑같이 작성
    // 주소창을 통해서 보내는 데이터값이나 폼태그에서 입력한 데이터값들은 전부 String
    // 게시글이 있는 콜렉션에 게시글번호값은 정수데이터라 데이터 유형을 매칭해야함
    // 해당 상세페이지로 들어가면 brdviews:0 값을 1 증가되도록 수정하는 updateOne() 함수
    db.collection("ex8_board").updateOne({brdid:Number(req.params.no)},{$inc:{brdviews:1}},function(err,result){
        db.collection("ex8_board").findOne({brdid:Number(req.params.no)},function(err,result){
            res.render("brd_detail",{data:result});
        });
    });
});