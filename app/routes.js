
var bodyParser = require('body-parser');
var mysql = require('mysql');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var passport = require('passport');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var upload = require('express-fileupload');
var formidable = require('formidable');
const multer = require('multer')

var one_week = new Array(7)//一個禮拜的日期
module.exports = function (app) {

  app.get(/(.*)\.(jpg|gif|png|ico|css|js|txt)/i, function (req, res) {
    res.sendfile(__dirname + "/" + req.params[0] + "." + req.params[1], function (err) {
      if (err) res.send(404);
    });
  })

  app.use(bodyParser.json());

  app.get('/', function (req, res) {
    res.render('login', { message: req.flash('loginMessage') });
  });

  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/reservation',
    failureRedirect: '/error',
    failureFlash: true
  }),
    function (req, res) {
      if (req.body.remember) {
        req.session.cookie.maxAge = 1000 * 60 * 3;
      } else {
        req.session.cookie.expires = false;
      }
      res.redirect('/');
    });
  app.get('/error', function (req, res) {
    res.render('error', {

    });
  });
  app.get('/errorreservation', function (req, res) {
    res.render('errorinreservation', {
    });
  });
  app.get('/erroredit', function (req, res) {
    res.render('erroredit', {

    });
  });

  app.get('/complete', function (req, res) {
    res.render('complete', {

    });
  });
  //homepae.ejs
  app.get('/homepage', isLoggedIn, function (req, res) {
    res.render('homepage', { user: req.user });
  })

  app.get('/checkin', isLoggedIn, function (req, res) {
    res.render('checkin', {
      user: req.user
    });
  });

  app.post('/checkin', function (req, res) {
    var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "123456",
      database: "nodejs_login",
    });
    var searchroom = req.body['ROOMID'];
    var searchstart = req.body['STARTTIME'];
    var searchend = req.body['ENDTIME'];
    var searchdate = req.body['OPENDATE'];
    var searchdepartment = req.body['DEPARTMENT'];
    var searchtopic = req.body['MEETINGNAME'];
    var searchmeetingroomcode = req.body['MEETCODE'];
    var sqlforsearch = 'select roomid as ROOMID,starttime as STARTTIME,endtime as ENDTIME,opendate as OPENDATE,department as DEPARTMENT,meetingroomcode as MEETCODE,meetingname as MEETINGNAME from reservation where (roomid="' + searchroom + '" OR starttime="' + searchstart + '"OR endtime="' + searchend + '"OR opendate="' + searchdate + '"OR department="' + searchdepartment + '"OR meetingname="' + searchtopic + '"OR meetingroomcode="' + searchmeetingroomcode + '")'
    con.query(sqlforsearch, function (err, rows) {
      console.log('搜尋結果', rows);
      if (err) {
        console.log(err);
      } else {
        res.json(rows);
      }
    }
    );
  });

  app.post('/memberlist', function (req, res, next) {
    var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "123456",
      database: "nodejs_login",
    });
    var sql = "select username as USERNAME,name as NAME,department as MEMBERDEPARTMENT,sign as SIGN from users"

    con.query(sql, function (err, rows) {
      console.log(rows);
      if (err) {
        console.log(err);
      } else {
        res.json(rows);
        //res.end();
      }
    })
  });
  app.post('/signfun', function (req, res) {
    var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "123456",
      database: "nodejs_login",
    });
    var username = req.body['USERNAME'];
    console.log(username);
    var sql = "update users set sign =  'O'  where username = '" + username + "'";

    con.query(sql, function (err, rows) {
      console.log(rows);
      if (err) {
        console.log(err);
      } else {
        res.send(true);
        //res.end();
      }
    })
  });


  //edit ejs function
  app.get('/edit', isLoggedIn, function (req, res) {
    res.render('edit', {
      user: req.user,
      test: ""
    });
  });
  app.get('/errorforupload', isLoggedIn, function (req, res) {
    res.render('errorforupload', {
    });
  });
  app.get('/completeforupload', isLoggedIn, function (req, res) {
    res.render('completeforupload', {

    });
  });




  app.post('/update', urlencodedParser, function (req, res) {
    console.log(req.body);

    var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "123456",
      database: "nodejs_login",
    });
    var updateroom = req.body['UPDATEROOM'];
    var updatestarttime = req.body['UPDATESTARTTIME'];
    var updateendtime = req.body['UPDATEENDTIME'];
    var updateopendate = req.body['UPDATEOPENDATE'];
    var updatedepartment = req.body['UPDATEDEPARTMENT'];
    var updatetopic = req.body['UPDATETOPIC'];
    var updatemeetingcode = req.body['UPDATECODE'];
    var sqlforedit = "update reservation set roomid='" + updateroom + "',starttime='" + updatestarttime + "',endtime='" + updateendtime + "',opendate='" + updateopendate + "',department='" + updatedepartment + "',meetingname='" + updatetopic + "' where meetingroomcode=" + updatemeetingcode;
    con.query(sqlforedit, function (err, rows) {
      if (err) {
        console.log(err);
      } else {
        res.send(true);
      }
    })

  });






  app.use(upload());
  app.post('/upload', function (req, res) {
    console.log(req.files);
    if (req.files.upfile) {
      var file = req.files.upfile,
        name = file.name,
        type = file.mimetype;
      var uploadpath = path.resolve(__dirname, '../uploads/' + name);

      file.mv(uploadpath, function (err) {
        if (err) {
          console.log("File Upload Failed", name, err);
          res.redirect("errorforupload")
        }
        else {
          console.log("File Uploaded", name);
          res.redirect('completeforupload')
        }
      });
    }
    else {
      res.redirect('errorforupload')
      res.end();
    };
  })


  app.get('/record', isLoggedIn, function (req, res) {
    var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "123456",
      database: "nodejs_login",
    });
    var sqlforrecord = 'select meetingname ,opendate,roomID from reservation'
    con.query(sqlforrecord, function (err, result) {
      console.log(result);
      meetingdata = result;
      if (err) {
        res.redirect('errorr')
      } else {
        res.render('record', { meetingdata: meetingdata, user: req.user })
      }
    });

  });

  var One_WeekData = new Array(7);
  var all_orderer = new Array();


  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  })

 

  //reservation.ejs insert and search
  var con = mysql.createConnection({ //con在get外可能會出錯
    host: "localhost",
    user: "root",
    password: "123456",
    database: "nodejs_login",
  });

  //輸入索引值(0,1,2,3,4,5,6)會回傳星期幾
  function setWeek(inputDay) {
    var d = new Date()
    var weekday = new Array(7)
    var day = Array()

    weekday[0] = "星期日"
    weekday[1] = "星期一"
    weekday[2] = "星期二"
    weekday[3] = "星期三"
    weekday[4] = "星期四"
    weekday[5] = "星期五"
    weekday[6] = "星期六"

    var j = 0;

    for (i = 0; i < weekday.length - inputDay; i++) {
      day[i] = weekday[inputDay + i];
    }
    while (day.length < weekday.length) {
      day[day.length] = weekday[j];
      j += 1;
    }

    return day
  }
  //輸入這個月的第幾天 day.seyDay(幾號) 會回傳yyyy/mm/dd格式的日期 
  function getFormatDate(setDate) {
    var date = new Date();
    date.setDate(setDate);
    var seperator = "/";
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
      month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
      strDate = "0" + strDate;
    }
    var currentdate = year + seperator + month + seperator + strDate;
    return currentdate;
  }

  //輸入 本月的第幾天 會回傳七天日期的陣列
  function setMyDate(date) {
    // var dates = Array(7) 移到外面變成屬性試試

    for (i = 0; i < 7; i++) {
      one_week[i] = getFormatDate(date + i)  // (2)
    }
    return one_week
  }

  var today = new Date();
  var sql_data = {}
  one_week = setMyDate(today.getDate())//預設日期   
  function setOneDayData(i, day) {
    var array_starttime = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    //var One_DayData = new Array(11);  
    for (t = 0; t < array_starttime.length; t++) {
      if (sql_data.reservation[i].starttime == array_starttime[t]) {
        for (j = 0; j < sql_data.reservation[i].section; j++) {
          day[t + j] = sql_data.reservation[i].meetingName;

        }
      }
    }
    return day
  }
  function setOrderer(i, orderer) {
    var array_starttime = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    //var One_DayData = new Array(11);  
    for (t = 0; t < array_starttime.length; t++) {
      if (sql_data.reservation[i].starttime == array_starttime[t]) {
        for (j = 0; j < sql_data.reservation[i].section; j++) {
          orderer[t + j] = sql_data.reservation[i].orderer;
        }
      }
    }
    return orderer
  }
  function setOneWeekData(i, WeekArray) {
    var Data_1 = new Array(11);
    var Data_2 = new Array(11);
    var Data_3 = new Array(11);
    var Data_4 = new Array(11);
    var Data_5 = new Array(11);
    var Data_6 = new Array(11);
    var Data_7 = new Array(11);

    var Data_1_Orderer = new Array(11);
    var Data_2_Orderer = new Array(11);
    var Data_3_Orderer = new Array(11);
    var Data_4_Orderer = new Array(11);
    var Data_5_Orderer = new Array(11);
    var Data_6_Orderer = new Array(11);
    var Data_7_Orderer = new Array(11);
    if (sql_data.reservation[i].opendate == WeekArray[0]) {
      One_WeekData[0] = setOneDayData(i, Data_1)
      all_orderer[0] = setOrderer(i, Data_1_Orderer)
      // console.log('第一天的會議', One_WeekData[0])
    } if (sql_data.reservation[i].opendate == WeekArray[1]) {
      console.log('第二天的會議', setOneDayData(i))
      One_WeekData[1] = setOneDayData(i, Data_2)
      all_orderer[1] = setOrderer(i, Data_2_Orderer)
    } if (sql_data.reservation[i].opendate == WeekArray[2]) {
      console.log('第三天的會議', sql_data.reservation[i])
      One_WeekData[2] = setOneDayData(i, Data_3)
      all_orderer[2] = setOrderer(i, Data_3_Orderer)
    } if (sql_data.reservation[i].opendate == WeekArray[3]) {
      console.log('第四天的會議', sql_data.reservation[i])
      One_WeekData[3] = setOneDayData(i, Data_4)
      all_orderer[3] = setOrderer(i, Data_4_Orderer)
    } if (sql_data.reservation[i].opendate == WeekArray[4]) {
      console.log('第五天的會議', sql_data.reservation[i])
      One_WeekData[4] = setOneDayData(i, Data_5)
      all_orderer[4] = setOrderer(i, Data_5_Orderer)
    } if (sql_data.reservation[i].opendate == WeekArray[5]) {
      console.log('第六天的會議', sql_data.reservation[i])
      One_WeekData[5] = setOneDayData(i, Data_6)
      all_orderer[5] = setOrderer(i, Data_6_Orderer)
    } if (sql_data.reservation[i].opendate == WeekArray[6]) {
      console.log('第七天的會議', sql_data.reservation[i])
      One_WeekData[6] = setOneDayData(i, Data_7)
      all_orderer[6] = setOrderer(i, Data_7_Orderer)
    }

  }

  var fakeData = [
    {
      roomID: '一號會議室',
      section: '03',
      starttime: '12:00',
      endtime: '15:00',
      orderer: '哭',
      opendate: '2020/01/03',
      department: '婦產科',
      type: "委員會",
      meetingID: '20200103121',
      meetingName: '婦產科委員會'
    },
    {
      roomID: '一號會議室',
      section: '04',
      starttime: '08:00',
      endtime: '12:00',
      orderer: 'Brian',
      opendate: '2020/01/04',
      type: "教育訓練",
      department: '婦產科',
      meetingID: '20200104081',
      meetingName: '婦產科教育訓練'
    },
    {
      roomID: '二號會議室',
      section: '04',
      starttime: '08:00',
      endtime: '12:00',
      orderer: 'Brian',
      opendate: '2020/01/04',
      department: "泌尿科",
      type: "委員會",
      meetingID: '20200104081',
      meetingName: '泌尿科委員會'
    }
  ];
  var fakeData2 = [
    [
      '婦產科教育訓練',
      '婦產科教育訓練',
      '婦產科教育訓練',
      '婦產科教育訓練',
      '婦產科教育訓練',
      "", "", "", "", "", ""
    ], [
      "",
      '泌尿科委員會',
      '泌尿科委員會',
      '',
      '',
      "", "", "", "", "", ""
    ], '', '', '', '', ""
  ]

  //一進去reservation就出現的表格 一號會議室 日期當天
  function setTable(WeekArray, roomID) {
    con.query("select roomID,date_format( timediff(endtime,starttime),'%h') as section,time_format(starttime,'%H:%i') as starttime,time_format(endtime,'%H:%i') as endtime ,orderer,DATE_FORMAT(opendate," + "'" + "%Y/%m/%d" + "'" + ") as opendate,department,meetingID,meetingName from reservation where "
      + "datediff(opendate," + "'" + WeekArray[0] + "'" + ")<=7 " + " and datediff('" + WeekArray[0] + "',opendate) <=0" + " and" + " roomID =" + "'" + roomID + "'", function (err, rows) { //利用sql select一個日期七天之內的資料
        sql_data.reservation = rows;

        console.log('sql_data.reservation', sql_data.reservation)

        for (i = 0; i < One_WeekData.length; i++) {

          if (One_WeekData[i] == null) {
            One_WeekData[i] = ''
          }
          if (all_orderer[i] == null) {
            all_orderer[i] = ''
          }
        }

        for (i = 0; i < sql_data.reservation.length; i++) {
          setOneWeekData(i, WeekArray)
        }
        console.log('全部資料', One_WeekData)
        console.log('預約者', all_orderer)
      });
  }
  setTable(one_week)





  app.get('/reservation', isLoggedIn, function (req, res) {

    var roomid = req.body.room_search
    var search_date = req.body.searchdate
    console.log(roomid)
    res.render('reservation.ejs', {
      user: req.user,
      table_day: setWeek(today.getDay()),
      table_date: one_week,
      roomID: roomid,
      date: search_date,
      data: One_WeekData,
      orderer: all_orderer,
      roomID: '一號會議室'
    });
  });

  //查詢的動作
  app.post('/datasearch', isLoggedIn, function (req, res) {
    one_weekData = new Array(7)
    var search_room = req.body.meetingroom
    var search_date = req.body.searchdate
    var new_date = new Date(search_date)
    var new_one_week = setMyDate(new_date.getDate()) //一個禮拜的日期陣列
    setTable(new_one_week, search_room)
    var data = new Array();
    if (search_room == "一號會議室") {
      data = One_WeekData
    } else {
      data = fakeData2
    }
  
  
        res.render('reservation', {
         
          user: req.user,
          table_day: setWeek(new_date.getDay()),
          table_date: one_week,
          orderer: all_orderer,
          data: data,
          date: search_date,
          roomID: search_room
        
      
    });
    //  res.redirect('/reservation');
  });
  app.post('/insert', function (req, res) {

    res.render("success")
  });




  app.get('/data_0,0', isLoggedIn, function (req, res) {

    var name = '婦產科教育訓練'
    var id = '20200114072'
    var roomid = "二號會議室"
    var starttime = "7:00"
    var endtime = "12:00"
    var opendate = "2020/01/14"
    var orderer = "Andy(666)"
    res.render('edit.ejs', {
      user: req.user,
      name: name,
      id: id,
      room: roomid,
      starttime: starttime,
      endtime: endtime,
      opendate: opendate,
      orderer: orderer

    });

  });

};




// console.log(con);
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');

}

