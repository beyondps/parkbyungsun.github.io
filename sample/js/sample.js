'use strict';

var _URL = window.URL || window.webkitURL;

var imgFile;

var aList = [];

var svg;
var objSize = 0;
$(function() {
    $(document).on('change', '.btn-file :file', function() {
        var input = $(this),
            label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
        input.trigger('fileselect', label);
    });

    $('.btn-file :file').on('fileselect', function(event, label) {
        var input = $(this).parents('.input-group').find(':text'),
            log = label;
        
        if( input.length ) {
            input.val(log);
        } else {
            if( log ) alert(log);
        }
    
    });

    $("#imgInp").change(function(e) {
        var file, img;

        if ((file = this.files[0])) {
            imgFile = file;
            img = new Image();
            img.onload = function() {
                console.log('width : ' + this.width + ', height : ' + this.height);
                $('#img-upload').attr('src', this.src);
            };
            img.onerror = function() {
                alert( "not a valid file: " + file.type);
            };
            img.src = _URL.createObjectURL(file);
        }
    });

    // D3 init
    // var width = '100%', height = '100%';
    svg = d3.select('#svg');
        // .attr('width', width)
        // .attr('height', height);

    // svg.append('svg:image').attr('xlink:href', 'http://res.cloudinary.com/dymmtln3y/image/upload/v1536543450/rcf2zihtflxuqrjbbw1o.png');
    svg.append('svg:image');
    // svg.append("circle").attr("cx", 30).attr("cy", 30).attr("r", 20);

    // firebase 에서 기본 정보 가져온다
    var dispRef = db.ref('/sample/disp');

    dispRef.on('value', function(jo){
        // console.log(jo.val());

        var src = '';
        // for(var dt in jo.val()){
        //     var obj = jo.val()[dt];
        //     // console.log(dt);
        //     // console.log('data : ', obj);

        //     src = obj.url;
        // }

        var obj = jo.val();
        if(obj.url){
            $('#img-upload').attr('src', obj.url);
        }
    });

    var actionListEm = $('#subAction');
    var rectRef = db.ref('/sample/rect');
    rectRef.on('value', function(jo){
        svg.selectAll('rect.rectangle').remove();
        
        for(var id in jo.val()){
            var obj = jo.val()[id];
            svg.append('rect')
                .attr('id', id)
                .attr('x', obj.x)
                .attr('y', obj.y)
                .attr('width', obj.width)
                .attr('height', obj.height)
                .attr('class', 'rectangle')
                .call(d3.drag()
                    .on('start', rectEv.dragstarted)
                    .on('drag', rectEv.dragged)
                    .on('end', rectEv.dragended))
                .on('click', rectEv.clickFunc);
        }
    });

    // 오브젝트 변경 on event
    var objRef = db.ref('/sample/obj');
    objRef.on('value', function(jo){

        svg.selectAll('g').remove();

        actionListEm.empty();
        var html = '';
        objSize = 0;

        var data = [];
        for(var id in jo.val()){
            var obj = jo.val()[id];

            html += "<li class='list-group-item' id='L"+ id +"'><div class='row'><div class='col-1' onclick='listSelect(\""+id+"\")'>"+obj.num+"</div>"
                + "<div class='col-10'>"
                + (obj.action_id ? obj.action_id : "<button type='button' class='btn btn-sm' data-toggle='modal' data-target='#exampleModalCenter' data-whatever='"+id+"'>New</button>")
                + "</div>"
                + "<div class='col-1'><button type='button' class='close' aria-label='Close' onclick='actionDelete(\""+ id +"\")'>"
                + "<span aria-hidden='true'>&times;</span>"
                + "</button></div>"
                + "</div></li>";
            data.push({x: obj.x, y: obj.y, num: obj.num, id: id});
            objSize++;
        }
        actionListEm.html(html);

        var objG = svg.selectAll('g').data(data).enter().append('g');
        objG.append('rect')
            .attr('id', function(d){return d.id})
            .attr('x', function(d){return d.x - 13})
            .attr('y', function(d){return d.y - 14})
            .attr('width', 26)
            .attr('height', 28)
            .attr('rx', 8);

        objG.append('text')
            .attr('x', function(d){return d.x - (d.num >= 10 ? 7 : 4)})
            .attr('y', function(d){return d.y + 5})
            .text(function(d){return d.num});

        dragEv.init(svg.selectAll('g'));

        objG.on('click', function(d){
            d3.selectAll('rect').style('fill', 'white');
            d3.select(this).select('rect').transition().duration(500).style('fill', 'red');

            actionListEm.find('li').removeClass('active');
            actionListEm.find('#L' + d.id).addClass('active');
        });

    });

    // tab event
    $('#svg').hide();
    $('a[data-toggle="tab"]').on('show.bs.tab', function (e) {
        var index = $('a[data-toggle="tab"]').index(this);

        if(index === 0){
            $('#img-upload, .cropper-container').show();
            $('#svg').hide();
        }else if(index === 2){
            $('#img-upload, .cropper-container').hide();
            $('#svg').show();
        }
    });

});


// cropper
var cropFunc = function(){
};
cropFunc.prototype = {
    _URL: 'https://api.cloudinary.com/v1_1/dymmtln3y/image/upload',
    _PRESETS: 'k30ie5ru',

    cropper: null,

    dataUrl: null,
    // method
    init: function(){
        var img = document.querySelector('#img-upload');
        if(img.src){
            var opt = {
                viewMode: 1
            };
            this.cropper = new Cropper(img, opt);
        }
    },
    clear: function(){
        this.cropper.clear();
    },
    getCrop: function(){
        if(this.cropper){
            this.dataUrl = this.cropper.getCroppedCanvas().toDataURL('image/jpeg');
            $('#subImages').append('<li class="list-group-item"><img src="' + this.dataUrl + '" onclick="imgSelect(this)"></li>');
        }
    },

    upload: function(){
        
        var formData = new FormData();
        // var imgFile = document.querySelector('#img-upload');

        console.log(imgFile);


        formData.append('file', imgFile);
        formData.append("upload_preset", this._PRESETS);
        // formData.append('api_key', '256533272476562');

        axios.post(this._URL, formData, {
            header: {'X-Requested-With': 'XMLHttpRequest'}
        })
            .then(function(res){
                if(res){
                    var imgData = new imgFunc();
                    imgData.url = res.data.url;
                    imgData.name = res.data.public_id;
                    var dispRef = db.ref('/sample/disp');
                    // dispRef.push(imgData);
                    dispRef.set(imgData);
                }
            })
            .catch(function(err){console.log(err)});
    }

    // test
    ,toImage: function(){
        var svg = document.querySelector('svg');
        var xml = (new XMLSerializer).serializeToString(svg);
        $("#img-upload").attr('src', 'data:image/svg+xml;charset=utf-8,' + xml);
    }
};
var crop = new cropFunc();
// END cropFunc



// crop -> svg image
function imgSelect(em){
    svg.select('image').attr('href', em.src);
}


function test(){


    console.log('test');
}












// 사각영역 그리기
d3.select('#rectangle').on('click', function(){ new Rectangle(); });
function Rectangle(){
    var self = this, rect, rectData = [], isDown = false, m1, m2, isDrag = false;
    
    var date = new Date();
    var components = [
        date.getYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
    ];
    var id = components.join("");

    svg.on('mousedown', function() {
        m1 = d3.mouse(this);
        if (!isDown && !isDrag) {
            self.rectData = [ { x: m1[0], y: m1[1] }, { x: m1[0], y: m1[1] } ];
            self.rectangleElement = d3.select('svg').append('rect')
                .attr('id', id)
                .attr('class', 'rectangle');

            // console.log(self.rectangleElement);
            // self.pointElement1 = d3.select('svg').append('circle').attr('class', 'pointC').call(dragC1);
            // self.pointElement2 = d3.select('svg').append('circle').attr('class', 'pointC').call(dragC2);            
            // self.pointElement3 = svg.append('circle').attr('class', 'pointC').call(dragC3);
            // self.pointElement4 = svg.append('circle').attr('class', 'pointC').call(dragC4);
            updateRect();
            isDrag = false;
        } else { 
            isDrag = true;
        }
        isDown = !isDown;     
    })
    .on('mousemove', function() {
        m2 = d3.mouse(this);
        if(isDown && !isDrag) {
            self.rectData[1] = { x: m2[0], y: m2[1] };
            updateRect();
        } 
    })
    .on('mouseup', function(){
        if(!isDrag){
            var pars = {
                x: self.rectData[1].x - self.rectData[0].x > 0 ? self.rectData[0].x :  self.rectData[1].x,
                y: self.rectData[1].y - self.rectData[0].y > 0 ? self.rectData[0].y :  self.rectData[1].y,
                width: Math.abs(self.rectData[1].x - self.rectData[0].x),
                height: Math.abs(self.rectData[1].y - self.rectData[0].y)
            };

            var rectRef = db.ref('/sample/rect/' + id);
            rectRef.set(pars);
        }
        isDown = false;
        isDrag = true;
    });

    function updateRect() {
        rect = d3.select(self.rectangleElement._groups[0][0]);

        var opt = {
                x: self.rectData[1].x - self.rectData[0].x > 0 ? self.rectData[0].x :  self.rectData[1].x,
                y: self.rectData[1].y - self.rectData[0].y > 0 ? self.rectData[0].y :  self.rectData[1].y,
                width: Math.abs(self.rectData[1].x - self.rectData[0].x),
                height: Math.abs(self.rectData[1].y - self.rectData[0].y)
            };

        rect.attr("x", opt.x).attr("y", opt.y).attr("width", opt.width).attr("height", opt.height);

        // rect.attr({
        //     "x": opt.x,
        //     "y": opt.y,
        //     "width": opt.width,
        //     "height": opt.height
        // });   
        
        // var point1 = d3.select(self.pointElement1[0][0]).data(self.rectData);
        // point1.attr('r', 5)
        //       .attr('cx', self.rectData[0].x)
        //       .attr('cy', self.rectData[0].y);        
        // var point2 = d3.select(self.pointElement2[0][0]).data(self.rectData);
        // point2.attr('r', 5)
        //       .attr('cx', self.rectData[1].x)
        //       .attr('cy', self.rectData[1].y);
        // var point3 = d3.select(self.pointElement3[0][0]).data(self.rectData);
        // point3.attr('r', 5)
        //       .attr('cx', self.rectData[1].x)
        //       .attr('cy', self.rectData[0].y);        
        // var point3 = d3.select(self.pointElement4[0][0]).data(self.rectData);
        // point3.attr('r', 5)
        //       .attr('cx', self.rectData[0].x)
        //       .attr('cy', self.rectData[1].y);
    }
}

// obj 객체 drag 이벤트
var dragEv = {
    deltaX: 0,
    deltaY: 0,
    init: function(d3Obj) {
        var dragHandler = d3.drag()
        // .on("start", function () {
        //     var current = d3.select(this).selectAll('rect, text');
        //     deltaX = current.attr("x") - d3.event.x;
        //     deltaY = current.attr("y") - d3.event.y;
        // })
        // .on("drag", function (d) {console.log(d);
        //     d3.select(this).selectAll('rect, text')
        //         .attr("x", d3.event.x + deltaX)
        //         .attr("y", d3.event.y + deltaY);
        // });
        .on('start', function(d){
            this.deltaX = d.x;
            this.deltaY = d.y;
        })
        .on("drag", function (d) {
            d3.select(this).selectAll('text')
                .attr("x", (d.x = d3.event.x) - (d.num >= 10 ? 7 : 4))
                .attr("y", (d.y = d3.event.y) + 5);
            d3.select(this).selectAll('rect')
                .attr("x", (d.x = d3.event.x) - 13)
                .attr("y", (d.y = d3.event.y) - 14);
        })
        .on('end', function(d){

            if(d.x - this.deltaX !== 0 || d.y - this.deltaY !== 0) {
                
                var pars = {x: d.x, y: d.y, num: d.num};
                var rectRef = db.ref('/sample/obj/' + d.id);
                rectRef.set(pars);
                console.log('변경OK');
            }
        });
        dragHandler(d3Obj);
    }
};

// rectangle Event
var rectEv = {
    m1:{}, m2:{},
    dragstarted: function() {
        var e = d3.event;
        var rectEm = d3.select(this);
        var rect_x = parseInt(rectEm.attr('x'));
        var rect_y = parseInt(rectEm.attr('y'));
        var ox = e.x - rect_x;
        var oy = e.y - rect_y;
        this.m1 = {x: ox, y: oy};
        this.m2 = e;
        // d3.select(this).raise().classed("active", true);
    },
    dragged: function() {
        var e = d3.event;
        d3.select(this).attr("x", e.x - this.m1.x).attr("y", e.y - this.m1.y);
    },
    dragended: function() {
        var e = d3.event;
        if(e.x - this.m2.x !== 0 || e.y - this.m2.y !== 0) {
            console.log('move 완료!!');

            var rectEm = d3.select(this);
            var pars = {
                x: rectEm.attr('x'),
                y: rectEm.attr('y'),
                width: rectEm.attr('width'),
                height: rectEm.attr('height')
            };

            var rectRef = db.ref('/sample/rect/' + rectEm.attr('id'));
            rectRef.set(pars);
        }
        // d3.select(this).classed("active", false);
    },
    clickFunc: function() {
        var rectEm = d3.select(this);
        console.log(rectEm.attr('id'));
        d3.event.stopPropagation();
    }
};

// 생성버튼 클릭시 object 생성
d3.select('#objCreate').on('click', function(){ new ObjCreate(); });
function ObjCreate() {
    var isDraw = true;
    svg.on('mousedown', function() {
        if(isDraw) {
            var e = d3.mouse(this);

            var date = new Date();
            var components = [
                date.getYear(),
                date.getMonth(),
                date.getDate(),
                date.getHours(),
                date.getMinutes(),
                date.getSeconds(),
                date.getMilliseconds()
            ];
            var id = components.join("");

            var pars = {
                x: e[0],
                y: e[1],
                num: objSize + 1
            };

            var rectRef = db.ref('/sample/obj/' + id);
            rectRef.set(pars);
        }
    })
    .on('mousemove', function() {
    })
    .on('mouseup', function(){
        isDraw = false;
    });

}

// 리스트에서 x 클릭하여 삭제
function actionDelete(id){
    db.ref('/sample/obj/' + id).set(null);
}

// 리스트 항목 선택
function listSelect(id){
    $('#subAction li').removeClass('active');
    $('#subAction #L' + id).addClass('active');

    svg.selectAll('rect').style('fill', 'white').each(function(d){
        var rectId = d3.select(this).attr('id');
        if(id === rectId) {
            d3.select(this).transition().duration(200).style('fill', 'red');
        }
    });
}





// modal
$('#exampleModalCenter').on('shown.bs.modal', function (e) {
    console.log(e);
    var button = $(e.relatedTarget);
    var recipient = button.data('whatever');

    listSelect(recipient + '');

    var modal = $(this);


    console.log('recipient : ', recipient);




    /*
    var button = $(event.relatedTarget) // Button that triggered the modal
    var recipient = button.data('whatever') // Extract info from data-* attributes
    // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
    // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
    var modal = $(this)
    modal.find('.modal-title').text('New message to ' + recipient)
    modal.find('.modal-body input').val(recipient)
    */
});















// data object

var dispFunc = function(){};
dispFunc.prototype = {
    id: '',
    baseImageUrl: '',
    name: '',
    subImages: []
};

var imgFunc = function(){};
imgFunc.prototype = {
    url: '',
    name: ''
};


var actionFunc = function(){};
actionFunc.prototype = {
    x: 0,
    y: 0,
    num: '',
    page_id: '',
    action_id: ''
};















// Add a request interceptor
axios.interceptors.request.use(function (config) {console.log('request interceptor');
    // Do something before request is sent
    return config;
}, function (error) {
    // Do something with request error
    return Promise.reject(error);
});

// Add a response interceptor
axios.interceptors.response.use(function (response) {console.log('response interceptor');
    // Do something with response data
    return response;
}, function (error) {
    // Do something with response error
    return Promise.reject(error);
});









