function getQueryObject(url) {
    url = url == null ? window.location.href : url;
    var search = url.substring(url.lastIndexOf("?") + 1);
    var obj = {};
    //一个经典漂亮的正则表达式
    var reg = /([^?&=]+)=([^?&=]*)/g;
    search.replace(reg, function (rs, $1, $2) {
        var name = decodeURIComponent($1);
        var val = decodeURIComponent($2);
        val = String(val);
        obj[name] = val;
        return rs;
    });
    return obj;
}

function login() {

    var username = $("#username_log").val();
    var password = $("#pwd_log").val();

    var data = {
        "username": username,
        "password": password
    };

    $.ajax({
        type: 'POST',
        url: gobalConfig.base_url + 'api/user/login/',
        async: false,//note：这里ajax必须为同步请求，两个ajax必须先拿token,再拿用户信息
        data: JSON.stringify(data),
        contentType: 'application/json; charset=UTF-8',
        success: function (data_return) {
            var token = data_return["token"];
            window.sessionStorage.setItem('token', token)
        },
        error: function (data_return) {
            alert("账号密码错误或账号未激活，请重新登录");
            console.log(data_return["responseText"])
        }
    });
    $.ajax({
        type: 'GET',
        async: false,
        url: gobalConfig.base_url + 'api/user/info/',
        beforeSend: function (XMLHttpRequest) {
            var token = window.sessionStorage.getItem('token');
            if (token != null) {
                XMLHttpRequest.setRequestHeader("Authorization", "JWT " + token)
            }
        },
        success: function (data_return) {
            window.sessionStorage.setItem('userinfo', JSON.stringify(data_return));
            //window.location.href = "canvas.html"
            window.location.reload();
        }
    });
}


function register() {
    //todo:加正则判断
    var username = $("#username_reg").val();
    var password = $("#pwd_reg").val();
    if ($('#pwd_confirm_reg').val() != password) {
        alert("两次输入密码不一致");
        return;
    }
    var email = $("#email_reg").val();

    var data = {
        "username": username,
        "email": email,
        "password": password,
        "is_active":false,
    };

    $.ajax({
        type: 'POST',
        url: gobalConfig.base_url + 'api/user/register/',
        data: JSON.stringify(data),
        contentType: 'application/json; charset=UTF-8',
        success: function (data_return) {
            // var token = data_return["token"];
            // window.sessionStorage.setItem('token', token);
            // window.sessionStorage.setItem('userinfo', JSON.stringify(data_return));
            window.location.reload();
            alert("注册成功，请前往邮箱验证后登录")
        },
        error: function (data_return) {
            alert("用户名或邮箱已被注册")
            //iconsole.log(data_return["responseText"])
     	    window.location.reload();
        }
    })

}

function logout() {
    window.sessionStorage.removeItem('token');
    window.sessionStorage.removeItem('userinfo');
    window.location.reload();
}

function add_comment() {
    var title = $("#contact-info").val();
    var context = $("#question-describe").val();
    var picname = $("#contact-info").val();
    alert(picname);
    var data = {
        "title": title,
        "context": context,
    };
    $.ajax({
        type: 'POST',
        url: gobalConfig.base_url + 'api/comments/',
        data: JSON.stringify(data),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function (XMLHttpRequest) {
            var token = window.sessionStorage.getItem('token');
            if (token != null) {
                XMLHttpRequest.setRequestHeader("Authorization", "JWT " + token)
            }
        },
        success: function (data_return) {
            //alert("success");
            window.location.href = "feedback.html"
        },
        error: function (data_return) {
            //alert("error")
        }
    });
}
