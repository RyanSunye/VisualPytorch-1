var gobalConfig = {
    "base_url": "http://127.0.0.1:8000/"
};

/*$(function () {
    $('#submit').click( function (e) {
        var conn_list;
        var network = [];
        conn_list = jsPlumb.getAllConnections();
        console.log(conn_list);
        for (var i = 0; i < conn_list.length; i++) {
            var source_id = conn_list[i]["sourceId"];
            var target_id = conn_list[i]["targetId"];
            var conn = {
                "source": $("#" + source_id).attr("name"),
                "target": $("#" + target_id).attr("name")
            }
            network.push(conn);
        }

       $.ajax({
            type: 'POST',
            url: gobalConfig.base_url + 'NeuralNetwork/network/',
            data: JSON.stringify(network),
            contentType: 'application/json; charset=UTF-8',
            success: function (data_return) {
                alert(data_return);
            }
        });
    });
});*/


function get_network() {
    var conn_list;
    var nets_conn = [];
    var nets = {};
    $("#canvas").find(".node").each(function (index, element) {
        var id = $(element).attr('id');
        nets[id] = {
            "name": $(element).attr('name'),
            "attribute": eval('(' + window.sessionStorage.getItem(id) + ')'),
            "left": $(element).css('left'),
            "top": $(element).css('top')
        }
    });
    conn_list = jsPlumb.getAllConnections();
    console.log(conn_list);

    for (var i = 0; i < conn_list.length; i++) {
        var source_id = conn_list[i]["sourceId"];
        var target_id = conn_list[i]["targetId"];
        var conn = {
            "source": {
                "id": source_id,
                "anchor_position": conn_list[i]["endpoints"][0]["anchor"]["type"]
            },
            "target": {
                "id": target_id,
                "anchor_position": conn_list[i]["endpoints"][1]["anchor"]["type"]
            }
        };
        nets_conn.push(conn);
    }
    var epoch = $("#epoch").val();
    if (epoch == "") {
        epoch = "1";
    }
    var learning_rate = $("#learning_rate").val();
    if (learning_rate == "") {
        learning_rate = "0.5";
    }
    var batch_size = $("#batch_size").val();
    if (batch_size == "") {
        batch_size = "1";
    }
    var static = {
        "epoch": epoch,
        "optimizer": $("#optimzier").find("option:selected").val(),
        "learning_rate": learning_rate,
        "batch_size": batch_size
    };
    var data = {
        "name": $("#model_name").val(),
        "structure": {
            "nets": nets,
            "nets_conn": nets_conn,
            "static": static
        }
    };
    return data;
}

function translate_network() {
    var data = get_network()["structure"];
    console.log(data);
    $.ajax({
        type: 'POST',
        url: gobalConfig.base_url + 'api/NeuralNetwork/getcode/',
        data: JSON.stringify(data),
        contentType: 'application/json; charset=UTF-8',
        beforeSend: function (XMLHttpRequest) {
            var token = window.sessionStorage.getItem('token');
            if (token != null) {
                XMLHttpRequest.setRequestHeader("Authorization", "JWT " + token)
            }
        },
        success: function (data_return, status, xhr) {

            if (xhr.status == 200) {
                var main = "";
                var main_print = "";
                var model = "";
                var model_print = "";
                var ops = "";
                var ops_print = "";
                for (var i = 0; i < data_return["Main"].length; i++) {
                    main = main + data_return["Main"][i] + "<br>";
                    main_print=main_print+data_return["Main"][i] + "\n";
                }
                for (var i = 0; i < data_return["Model"].length; i++) {
                    model = model + data_return["Model"][i] + "<br>";
                    model_print=model_print+data_return["Model"][i] + "\n";
                }
                for (var i = 0; i < data_return["Ops"].length; i++) {
                    ops = ops + data_return["Ops"][i] + "<br>";
                    ops_print=ops_print+data_return["Ops"][i] + "\n";
                }
                var code = {
                    "model": model,
                    "main": main,
                    "ops": ops
                };
                var code_print = {
                    "model": model_print,
                    "main": main_print,
                    "ops": ops_print
                };
                window.sessionStorage.setItem("code", JSON.stringify(data_return));
                window.sessionStorage.setItem("code_print", JSON.stringify(code_print));
                window.open("show_code.html");
                //window.location.href="show_code.html";

            }
            else {
                alert(JSON.stringify(data_return));
            }

        },
        error: function (data_return) {
            alert(data_return["responseText"])
        }


    });
}


function save_network() {
    $("#save_modal").modal('hide');
    if (!window.sessionStorage.hasOwnProperty("userinfo")) {
        jump_to_login();
        return
    }
    var data = get_network();
    console.log(data);
    var query_object = getQueryObject(window.location.href);
    if (query_object.hasOwnProperty("id")) {
        var net_id = query_object["id"];
        $.ajax({
            type: 'PUT',
            url: gobalConfig.base_url + 'api/NeuralNetwork/network/' + net_id + '/',
            data: JSON.stringify(data),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function (XMLHttpRequest) {
                var token = window.sessionStorage.getItem('token');
                if (token != null) {
                    XMLHttpRequest.setRequestHeader("Authorization", "JWT " + token)
                }
            },
            success: function (data_return) {
            },
            error: function (data_return) {
                alert(data_return["responseText"])
            }
        });
    } else {
        $.ajax({
            type: 'POST',
            url: gobalConfig.base_url + 'api/NeuralNetwork/network/',
            data: JSON.stringify(data),
            contentType: 'application/json; charset=UTF-8',
            beforeSend: function (XMLHttpRequest) {
                var token = window.sessionStorage.getItem('token');
                if (token != null) {
                    XMLHttpRequest.setRequestHeader("Authorization", "JWT " + token)
                }
            },
            success: function (data_return) {
            },
            error: function (data_return) {
                alert(data_return["responseText"])
            }
        });
    }
}

function save_attr_linear_layer(button) {
    //这里是硬编码，考虑在b版本优化
    var id = button["id"].split("popover_")[1];
    var form = $("#" + button["id"]).parent();
    var in_channel = form.find("[name = \"in_channels\"]");
    var out_channel = form.find("[name = \"out_channels\"]");
    //todo:加入更精确的正则判断
    form.find("[name='input_error']").remove();
    //正整数
    var reg = /^\s*[1-9]\d*\s*$/;
    var flag = true;
    var check_array = [in_channel, out_channel];
    check_array.forEach(function (value, index, array) {
        if (!reg.test(value.val())) {
            value.after("<p name='input_error' class='alert_font'>请输入正整数</p>");
            flag = false;
        }
    });
    if (!flag) {
        return;
    }
    window.sessionStorage.setItem(id, "{\"in_channels\":\"" + in_channel.val() + "\", \"out_channels\":\"" + out_channel.val() + "\"}");
    $("#" + id).popover('hide');
}

function save_attr_view_layer(button) {
    //这里是硬编码，考虑在b版本优化
    var id = button["id"].split("popover_")[1];
    var form = $("#" + button["id"]).parent();
    var shape = form.find("[name = \"shape\"]");
    form.find("[name='input_error']").remove();
    //匹配符合要求的数组
    var reg = /^(\s*[1-9]\d*\s*)+(,\s*[1-9]\d*\s*)*$/;
    if (!reg.test(shape.val())) {
        shape.after("<p name='input_error' class='alert_font'>输入不合法</p>");
        return;

    }
    window.sessionStorage.setItem(id, "{\"shape\":\"" + shape.val() + "\"}");
    $("#" + id).popover('hide');
}

function save_attr_concatenate_layer(button) {
    var id = button["id"].split("popover_")[1];
    var form = $("#" + button["id"]).parent();
    var dim = form.find("[name = \"dim\"]");
    form.find("[name='input_error']").remove();
    var reg = /^\s*\d+\s*$/;
    if (!reg.test(dim.val())) {
        dim.after("<p name='input_error' class='alert_font'>输入不合法</p>");
        return;
    }
    window.sessionStorage.setItem(id, "{\"dim\":\"" + dim.val() + "\"}");
    $("#" + id).popover('hide');
}

function save_attr_conv1d_layer(button) {
    //这里是硬编码，考虑在b版本优化
    var id = button["id"].split("popover_")[1];
    var form = $("#" + button["id"]).parent();
    var in_channels = form.find("[name = \"in_channels\"]");
    var out_channels = form.find("[name = \"out_channels\"]");
    var kernel_size = form.find("[name = \"kernel_size\"]");
    var stride = form.find("[name = \"stride\"]");
    var padding = form.find("[name = \"padding\"]");
    var activity = form.find("[id=\"" + id + "activity\"]").find("option:selected").val();
    var pool_way = form.find("[id=\"" + id + "pool_way\"]").find("option:selected").val();
    //console.log(pool_way);
    var pool_kernel_size = form.find("[name = \"pool_kernel_size\"]");
    var pool_stride = form.find("[name = \"pool_stride\"]");
    var pool_padding = form.find("[name = \"pool_padding\"]");
    //todo:加入更精确的正则判断
    form.find("[name='input_error']").remove();
    var reg = /^\s*[1-9]\d*\s*$/;
    var reg_zero = /^\s*\d+\s*$/;
    var flag = true;
    var check_array1 = (pool_way=="None")?[in_channels, out_channels, kernel_size, stride]:[in_channels, out_channels, kernel_size, stride,pool_kernel_size,pool_stride];
    check_array1.forEach(function (value, index, array) {
        if (!reg.test(value.val())) {
            value.after("<p name='input_error' class='alert_font'>输入不合法</p>");
            flag = false;
        }
    });
    var check_array2 = (pool_way=="None")?[padding]:[padding,pool_padding];
    check_array2.forEach(function (value, index, array) {
        if (!reg_zero.test(value.val())) {
            value.after("<p name='input_error' class='alert_font'>输入不合法</p>");
            flag = false;
        }
    });
    if (!flag) {
        return;
    }
    //var activity = form.find("[name = \"activity\"]").val();
    //var pool_way = form.find("[name = \"pool_way\"]").val();
    window.sessionStorage.setItem(id, "{\"in_channels\":\"" + in_channels.val() + "\", \"out_channels\":\"" + out_channels.val() + "\", \"kernel_size\":\"" + kernel_size.val() + "\", " +
        "\"stride\":\"" + stride.val() + "\", \"padding\":\"" + padding.val() + "\",\"activity\":\"" + activity + "\",\"pool_way\":\"" + pool_way + "\",\"pool_kernel_size\":\"" + pool_kernel_size.val() + "\"," +
        "\"pool_stride\":\"" + pool_stride.val() + "\",\"pool_padding\":\"" + pool_padding.val() + "\"}");
    $("#" + id).popover('hide');
}

function save_attr_conv2d_layer(button) {
    //这里是硬编码，考虑在b版本优化
    var id = button["id"].split("popover_")[1];
    var form = $("#" + button["id"]).parent();
    var in_channels = form.find("[name = \"in_channels\"]");
    var out_channels = form.find("[name = \"out_channels\"]");
    var kernel_size = form.find("[name = \"kernel_size\"]");
    var stride = form.find("[name = \"stride\"]");
    var padding = form.find("[name = \"padding\"]");
    var activity = form.find("[id=\"" + id + "activity\"]").find("option:selected").val();
    var pool_way = form.find("[id=\"" + id + "pool_way\"]").find("option:selected").val();
    var pool_kernel_size = form.find("[name = \"pool_kernel_size\"]");
    var pool_stride = form.find("[name = \"pool_stride\"]");
    var pool_padding = form.find("[name = \"pool_padding\"]");
    //todo:加入更精确的正则判断
    form.find("[name='input_error']").remove();
    var reg = /^\s*[1-9]\d*\s*$/;
    var reg_zero = /^\s*\d+\s*$/;
    var flag = true;
    var check_array1 = (pool_way=="None")?[in_channels, out_channels, kernel_size, stride]:[in_channels, out_channels, kernel_size, stride,pool_kernel_size,pool_stride];
    check_array1.forEach(function (value, index, array) {
        if (!reg.test(value.val())) {
            value.after("<p name='input_error' class='alert_font'>输入不合法</p>");
            flag = false;
        }
    });
    var check_array2 = (pool_way=="None")?[padding]:[padding,pool_padding];
    check_array2.forEach(function (value, index, array) {
        if (!reg_zero.test(value.val())) {
            value.after("<p name='input_error' class='alert_font'>输入不合法</p>");
            flag = false;
        }
    });
    if (!flag) {
        return;
    }
    //var activity = form.find("[name = \"activity\"]").val();
    //var pool_way = form.find("[name = \"pool_way\"]").val();
    window.sessionStorage.setItem(id, "{\"in_channels\":\"" + in_channels.val() + "\", \"out_channels\":\"" + out_channels.val() + "\", \"kernel_size\":\"" + kernel_size.val() + "\", " +
        "\"stride\":\"" + stride.val() + "\", \"padding\":\"" + padding.val() + "\",\"activity\":\"" + activity + "\",\"pool_way\":\"" + pool_way + "\",\"pool_kernel_size\":\"" + pool_kernel_size.val() + "\"," +
        "\"pool_stride\":\"" + pool_stride.val() + "\",\"pool_padding\":\"" + pool_padding.val() + "\"}");
    $("#" + id).popover('hide');
}




function save_attr_linear_layer_form(id) {
    //这里是硬编码，考虑在b版本优化

    var form = $("#form" + id).parent();
    var in_channel = form.find("[name = \"in_channels\"]");
    var out_channel = form.find("[name = \"out_channels\"]");
    //todo:加入更精确的正则判断
    form.find("[name='input_error']").remove();
    //正整数
    var reg = /^\s*[1-9]\d*\s*$/;
    var flag = true;
    var check_array = [in_channel, out_channel];
    check_array.forEach(function (value, index, array) {
        if (!reg.test(value.val())) {
            value.after("<p name='input_error' class='alert_font'>请输入正整数</p>");
            flag = false;
        }
    });
    if (!flag) {
        return;
    }
    window.sessionStorage.setItem(id, "{\"in_channels\":\"" + in_channel.val() + "\", \"out_channels\":\"" + out_channel.val() + "\"}");
    $("#" + id).popover('hide');
}

function save_attr_view_layer_form(id) {
    //这里是硬编码，考虑在b版本优化
    var form = $("#form" + id).parent();
    var shape = form.find("[name = \"shape\"]");
    form.find("[name='input_error']").remove();
    //匹配符合要求的数组
    var reg = /^(\s*[1-9]\d*\s*)+(,\s*[1-9]\d*\s*)*$/;
    if (!reg.test(shape.val())) {
        shape.after("<p name='input_error' class='alert_font'>输入不合法</p>");
        return;

    }
    window.sessionStorage.setItem(id, "{\"shape\":\"" + shape.val() + "\"}");
    $("#" + id).popover('hide');
}

function save_attr_concatenate_layer_form(id) {
    var form = $("#form" + id).parent();
    var dim = form.find("[name = \"dim\"]");
    form.find("[name='input_error']").remove();
    var reg = /^\s*\d+\s*$/;
    if (!reg.test(dim.val())) {
        dim.after("<p name='input_error' class='alert_font'>输入不合法</p>");
        return;
    }
    window.sessionStorage.setItem(id, "{\"dim\":\"" + dim.val() + "\"}");
    $("#" + id).popover('hide');
}

function save_attr_conv1d_layer_form(id) {
    //这里是硬编码，考虑在b版本优化
    var form = $("#form" + id).parent();
    var in_channels = form.find("[name = \"in_channels\"]");
    var out_channels = form.find("[name = \"out_channels\"]");
    var kernel_size = form.find("[name = \"kernel_size\"]");
    var stride = form.find("[name = \"stride\"]");
    var padding = form.find("[name = \"padding\"]");
    var activity = form.find("[id=\"" + id + "activity\"]").find("option:selected").val();
    var pool_way = form.find("[id=\"" + id + "pool_way\"]").find("option:selected").val();
    //console.log(pool_way);
    var pool_kernel_size = form.find("[name = \"pool_kernel_size\"]");
    var pool_stride = form.find("[name = \"pool_stride\"]");
    var pool_padding = form.find("[name = \"pool_padding\"]");
    //todo:加入更精确的正则判断
    form.find("[name='input_error']").remove();
    var reg = /^\s*[1-9]\d*\s*$/;
    var reg_zero = /^\s*\d+\s*$/;
    var flag = true;
    var check_array1 = (pool_way=="None")?[in_channels, out_channels, kernel_size, stride]:[in_channels, out_channels, kernel_size, stride,pool_kernel_size,pool_stride];
    check_array1.forEach(function (value, index, array) {
        if (!reg.test(value.val())) {
            value.after("<p name='input_error' class='alert_font'>输入不合法</p>");
            flag = false;
        }
    });
    var check_array2 = (pool_way=="None")?[padding]:[padding,pool_padding];
    check_array2.forEach(function (value, index, array) {
        if (!reg_zero.test(value.val())) {
            value.after("<p name='input_error' class='alert_font'>输入不合法</p>");
            flag = false;
        }
    });
    if (!flag) {
        return;
    }
    //var activity = form.find("[name = \"activity\"]").val();
    //var pool_way = form.find("[name = \"pool_way\"]").val();
    window.sessionStorage.setItem(id, "{\"in_channels\":\"" + in_channels.val() + "\", \"out_channels\":\"" + out_channels.val() + "\", \"kernel_size\":\"" + kernel_size.val() + "\", " +
        "\"stride\":\"" + stride.val() + "\", \"padding\":\"" + padding.val() + "\",\"activity\":\"" + activity + "\",\"pool_way\":\"" + pool_way + "\",\"pool_kernel_size\":\"" + pool_kernel_size.val() + "\"," +
        "\"pool_stride\":\"" + pool_stride.val() + "\",\"pool_padding\":\"" + pool_padding.val() + "\"}");
    $("#" + id).popover('hide');
}

function save_attr_conv2d_layer_from(id) {
    //这里是硬编码，考虑在b版本优化
    var form = $("#form" + id).parent();
    var in_channels = form.find("[name = \"in_channels\"]");
    var out_channels = form.find("[name = \"out_channels\"]");
    var kernel_size = form.find("[name = \"kernel_size\"]");
    var stride = form.find("[name = \"stride\"]");
    var padding = form.find("[name = \"padding\"]");
    var activity = form.find("[id=\"" + id + "activity\"]").find("option:selected").val();
    var pool_way = form.find("[id=\"" + id + "pool_way\"]").find("option:selected").val();
    var pool_kernel_size = form.find("[name = \"pool_kernel_size\"]");
    var pool_stride = form.find("[name = \"pool_stride\"]");
    var pool_padding = form.find("[name = \"pool_padding\"]");
    //todo:加入更精确的正则判断
    form.find("[name='input_error']").remove();
    var reg = /^\s*[1-9]\d*\s*$/;
    var reg_zero = /^\s*\d+\s*$/;
    var flag = true;
    var check_array1 = (pool_way=="None")?[in_channels, out_channels, kernel_size, stride]:[in_channels, out_channels, kernel_size, stride,pool_kernel_size,pool_stride];
    check_array1.forEach(function (value, index, array) {
        if (!reg.test(value.val())) {
            value.after("<p name='input_error' class='alert_font'>输入不合法</p>");
            flag = false;
        }
    });
    var check_array2 = (pool_way=="None")?[padding]:[padding,pool_padding];
    check_array2.forEach(function (value, index, array) {
        if (!reg_zero.test(value.val())) {
            value.after("<p name='input_error' class='alert_font'>输入不合法</p>");
            flag = false;
        }
    });
    //var activity = form.find("[name = \"activity\"]").val();
    //var pool_way = form.find("[name = \"pool_way\"]").val();
    window.sessionStorage.setItem(id, "{\"in_channels\":\"" + in_channels.val() + "\", \"out_channels\":\"" + out_channels.val() + "\", \"kernel_size\":\"" + kernel_size.val() + "\", " +
        "\"stride\":\"" + stride.val() + "\", \"padding\":\"" + padding.val() + "\",\"activity\":\"" + activity + "\",\"pool_way\":\"" + pool_way + "\",\"pool_kernel_size\":\"" + pool_kernel_size.val() + "\"," +
        "\"pool_stride\":\"" + pool_stride.val() + "\",\"pool_padding\":\"" + pool_padding.val() + "\"}");
    $("#" + id).popover('hide');
}

function save_attr_softmax_layer_form(id){
    var form = $("#form" + id).parent();
    var dim = form.find("[name = \"dim\"]");
    form.find("[name='input_error']").remove();
    var reg = /^\s*\d+\s*$/;
    if (!reg.test(dim.val())) {
        dim.after("<p name='input_error' class='alert_font'>输入不合法</p>");
        return;
    }
    window.sessionStorage.setItem(id, "{\"dim\":\"" + dim.val() + "\"}");
    $("#" + id).popover('hide');
}

function save_attr_dropout_layer_form(id){
    var form = $("#form" + id).parent();
    var p = form.find("[name = \"p\"]");
    var type = form.find("[id=\"" + id + "type\"]").find("option:selected").val();
    //console.log(type);
    form.find("[name='input_error']").remove();
    var reg = /^\s*\d+\s*$/;
    if (!reg.test(p.val())) {
        p.after("<p name='input_error' class='alert_font'>输入不合法</p>");
        return;
    }

    window.sessionStorage.setItem(id, "{\"type\":\"" + type +" \",\"p\":\"" + p.val() + "\"}");
    $("#" + id).popover('hide');
}

function save_attr_conv_layer_form(id){
    //这里是硬编码，考虑在b版本优化
    var form = $("#form" + id).parent();
    var layer_type = form.find("[id=\"" + id + "layer_type\"]").find("option:selected").val();
    var type = form.find("[id=\"" + id + "type\"]").find("option:selected").val();
    var in_channels = form.find("[name = \"in_channels\"]");
    var out_channels = form.find("[name = \"out_channels\"]");
    var kernel_size = form.find("[name = \"kernel_size\"]");
    var stride = form.find("[name = \"stride\"]");
    var padding = form.find("[name = \"padding\"]");

//in_channel(int):输入通道数 非0正数 无默认值

// out_channel(int):输出通道数 非0正数 无默认值

// kernel_size (int) : 卷积核的尺寸 非0正数 无默认值

// stride (int) : 卷积步长 非0正数 默认值为1

// padding (int) : 补充0的层数 非负整数 默认值为0
    //todo:加入更精确的正则判断
    form.find("[name='input_error']").remove();
    var reg = /^\s*[1-9]\d*\s*$/;
    var reg_zero = /^\s*\d+\s*$/;
    var flag = true;
    var check_array1 = [in_channels, out_channels, kernel_size, stride];
    check_array1.forEach(function (value, index, array) {
        if (!reg.test(value.val())) {
            value.after("<p name='input_error' class='alert_font'>输入不合法</p>");
            flag = false;
        }
    });
    var check_array2 = [padding];
    check_array2.forEach(function (value, index, array) {
        if (!reg_zero.test(value.val())) {
            value.after("<p name='input_error' class='alert_font'>输入不合法</p>");
            flag = false;
        }
    });
    if (!flag) {
        return;
    }
    //var activity = form.find("[name = \"activity\"]").val();
    //var pool_way = form.find("[name = \"pool_way\"]").val();
    window.sessionStorage.setItem(id, "{ \"layer_type\":\""+layer_type+"\",\"type\":\""+ type +"\",\"in_channels\":\"" + in_channels.val() + "\", \"out_channels\":\"" + out_channels.val() + "\", \"kernel_size\":\"" + kernel_size.val() + "\", " +
        "\"stride\":\"" + stride.val() + "\", \"padding\":\"" + padding.val() + "\"}");
    $("#" + id).popover('hide');
}

function save_attr_pool_layer_form(id){
    var form = $("#form" + id).parent();
    var layer_type = form.find("[id=\"" + id + "layer_type\"]").find("option:selected").val();
    var type = form.find("[id=\"" + id + "type\"]").find("option:selected").val();
    var kernel_size = form.find("[name = \"kernel_size\"]");
    var stride = form.find("[name = \"stride\"]");
    var padding = form.find("[name = \"padding\"]");
    var ceil_mode = form.find("[id=\"" + id + "ceil_mode\"]").find("option:selected").val();
    var count_include_pad = form.find("[id=\"" + id + "count_include_pad\"]").find("option:selected").val();
//layer_type:下拉框三选一，选项包括max_pool/avg_pool/max_unpool 无默认值
// type:下拉框三选一，选项包括1d/2d/3d 无默认值

// kernel_size (int) : 卷积核的尺寸 非0正数 无默认值

// stride (int) : 卷积步长 非0正数 无默认值

// padding (int) : 补充0的层数 非负整数 默认值为0

// ceil_mode:下拉框二选一，ceil/floor 默认值为floor

// count_include_pad:下拉框二选一,true/false 默认值为true
    //todo:加入更精确的正则判断
    form.find("[name='input_error']").remove();
    var reg = /^\s*[1-9]\d*\s*$/;
    var reg_zero = /^\s*\d+\s*$/;
    var flag = true;
    var check_array1 = [kernel_size, stride];
    check_array1.forEach(function (value, index, array) {
        if (!reg.test(value.val())) {
            value.after("<p name='input_error' class='alert_font'>输入不合法</p>");
            flag = false;
        }
    });
    var check_array2 = [padding];
    check_array2.forEach(function (value, index, array) {
        if (!reg_zero.test(value.val())) {
            value.after("<p name='input_error' class='alert_font'>输入不合法</p>");
            flag = false;
        }
    });
    if (!flag) {
        return;
    }
    //var activity = form.find("[name = \"activity\"]").val();
    //var pool_way = form.find("[name = \"pool_way\"]").val();
    window.sessionStorage.setItem(id, "{ \"layer_type\":\""+ layer_type + "\",\"type\":\""+ type +"\",\"kernel_size\":\"" + kernel_size.val() + "\", " + "\"stride\":\"" + stride.val() + "\", \"padding\":\"" + padding.val() + "\",\"ceil_mode\":\""+ ceil_mode + "\",\"count_include_pad\":\"" + count_include_pad + "\"}");
    $("#" + id).popover('hide');

}

function save_attr_activation_layer_form(id){
    var form = $("#form" + id).parent();
    var layer_type = form.find("[id=\"" + id + "layer_type\"]").find("option:selected").val();
    var negative_slope = form.find("[name = \"negative_slope\"]");
    var weight = form.find("[name = \"weight\"]");
    var lower = form.find("[name = \"lower\"]");
    var upper = form.find("[name = \"upper\"]");
    form.find("[name='input_error']").remove();
// layer_type:下拉框，包括relu/sigmoid/tanh/leaky relu/PRelu/RRelu 默认值为relu

// relu：无参数

// sigmoid:无参数

// tanh:无参数

// leaky relu:

// negative_slope<正数> 默认值为0.01

// PRelu: 类似leaky relu, 但是负数部分斜率可学习

// weight<正数>权重初始化 非0正实数 默认值为0.25
// RRelu: 类似leaky relu, 但是负数部分斜率为随机均匀分布

// lower<正数>：均匀分布下限 默认值为0.125

// upper<正数>：均匀分布上限 默认值为0.333
//
//
    var positive = /^([1-9][0-9]*(\.\d+)?)|(0\.\d+)$/;
    var flag = true;
    var check_array1 = [negative_slope, weight,lower,upper];
    check_array1.forEach(function (value, index, array) {
        if (!positive.test(value.val())) {
            value.after("<p name='input_error' class='alert_font'>输入不合法</p>");
            flag = false;
        }
    });
    if (!flag) {
        return;
    }
    window.sessionStorage.setItem(id,"{\"layer_type\":\""+ layer_type +"\",\"negative_slope\":\""+ negative_slope.val() +"\",\"weight\":\""+ weight.val() +"\",\"lower\":\""+ lower.val() +"\",\"upper\":\"" + upper.val()+ "\"}");

}