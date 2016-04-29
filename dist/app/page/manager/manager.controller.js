(function () {
    'use strict';

    angular.module('app.manager', ['app.service','validation.match','angularRandomString'])
        .controller('createManagerCtrl', ['$scope','$location','randomString', 'UserService','SchoolService', 'AuthService', 'StorageService', createManagerCtrl])
        .controller('managerCtrl', ['$scope','$location','randomString', 'UserService','SchoolService', 'AuthService', '$stateParams',managerCtrl])
        .controller('importCtrl', ['$scope','$q','$location','randomString','UserService','AuthService','SchoolService','CourseService','SubjectService','ScheduleService','SessionService','AbsenceService','ErrorService','StorageService','$stateParams',importCtrl]);


    function createManagerCtrl ($scope, $location, randomString, UserService, SchoolService, AuthService, StorageService) {
        
        //$scope.user = UserService.get({id: "56b8d11c98a3eae30a734ac6"});
        $scope.phones = [];
        UserService.query({},function(users) {
            console.log(users);
            for (var i = 0; i < users.length; i++) {
                $scope.phones.push(users[i].phone);
            };
        });

        var orig_user, orig_school;

        $scope.user = {
            firstname: '',
            lastname: '',
            school: '',
            phone: '',
            type: 'manager',
            email: '',
            password: randomString()
        }   

        $scope.school = {
            name: '',
            country: 'Angola',
            city: '',
            address: '',
            manager: '',
            semesters: {
                first: {start: '', end: ''},
                second: {start: '', end: ''}
            }
        }

        orig_user = angular.copy($scope.user);
        orig_school = angular.copy($scope.school);

        $scope.canSubmit = function() {

            var email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            var phone = /^\d{9}$/;
            var users = StorageService.users();
            var schools = StorageService.schools();
            var validate_phone = false;
            
            if(!$scope.user.phone || !phone.test($scope.user.phone) || !phone.test($scope.school.phone) || $scope.phones.indexOf($scope.user.phone) > -1){return false;}
            if(!$scope.user.firstname || !$scope.user.lastname || !$scope.user.email || !$scope.school.name || !$scope.school.address || !$scope.school.city){return false;}
            for( var i = 0; i < schools.length; i++ ) { if($scope.school.phone == schools[i].phone || $scope.school.name == schools[i].name){ return false;} }
            if($scope.school.semesters.second.end <= $scope.school.semesters.second.start){return false}
            if($scope.school.semesters.first.end <= $scope.school.semesters.first.start){return false}
            if($scope.school.semesters.first.end >= $scope.school.semesters.second.start){return false}
            
            return $scope.userForm.$valid && !angular.equals($scope.user, orig_user) && !angular.equals($scope.school, orig_school);
        };    
        
        $scope.submitForm = function() {
            //console.log($scope.school);    
            SchoolService.save($scope.school,function(school){ 
        
                $scope.user.school = school._id;
        
                AuthService.register.save($scope.user,function(user){ 
                $scope.user = user;
                StorageService.load();
                $location.url('/page/manager/profile/'+$scope.user._id);});
                
        });
        };           
    }

    function managerCtrl ($scope, $location, randomString, UserService, SchoolService, AuthService, $stateParams) {
        $scope.id = $stateParams.id;
        
        UserService.get({id: $scope.id},function(user) {
            $scope.user = user;
            SchoolService.get({id: user.school},function(school) {
                console.log(school);
                $scope.school = school;
            }); 
        });
        

        var orig_user = angular.copy($scope.user);
        var orig_school = angular.copy($scope.school);

        $scope.canSubmit = function() { 
            return $scope.userForm.$valid && !angular.equals($scope.user, orig_user) && !angular.equals($scope.school, orig_school);
        };    
        
        $scope.submitForm = function() {
            //$scope.showInfoOnSubmit = true;

            
            UserService.update({id: $scope.user._id},$scope.user,function(user){ console.log(user);});

        };           
        
        
    }

    function importCtrl ($scope,$q,$location,randomString,UserService,AuthService,SchoolService,CourseService,SubjectService,ScheduleService,SessionService,AbsenceService,ErrorService,StorageService,$stateParams) {
        $scope.id = StorageService.me().school;
        //get school, courses_name, subjects_coursename,users_phone,users_email
        $scope.message = '';
        $scope.form_error = false;
        $scope.valid = false;
        $scope.existing_courses = {};
        $scope.courses_id = {};
        $scope.existing_subjects = {};
        $scope.existing_users = {};
        $scope.existing_emails = {}; 
            //console.log('Existing Courses',$scope.existing_courses);   
        
        
        if(!$scope.id){ $scope.message = "Escola inválida."; }
        
        SchoolService.get({id: $scope.id},
            function(school) {
                
                $scope.school = school;
                
                CourseService.query({school: $scope.school._id}, function(courses) {
                    $scope.courses = courses;
                    for(var i = 0; i < courses.length;i++){
                        $scope.existing_users[courses[i].name] = courses[i];
                        $scope.courses_id[courses[i]._id] = courses[i];
                    }
    
                    SubjectService.query({school: $scope.school._id}, function(subjects) {
                        $scope.subjects = subjects;
                        for(var i = 0; i < subjects.length;i++){ $scope.existing_subjects[$scope.courses_id[subjects[i].course].name+_+subjects[i].name] = subjects[i]; }
                        
                        UserService.query({}, function(users) {
                            $scope.users = users;
                            for(var i = 0; i < users.length;i++){
                                $scope.existing_users[users[i].phone] = users[i];
                                $scope.existing_emails[users[i].email] = users[i];
                            }
                            //CODE START
        $scope.courses = {}; $scope.subjects = {}; $scope.professors = {}; $scope.students = {}; $scope.schedules = {};
        $scope.courses_valid = false; $scope.subjects_valid = false; $scope.professors_valid = false; $scope.students_valid = false; $scope.schedules_valid = false;
        $scope.courses_done = false; $scope.subjects_done = false; $scope.professors_done = false; $scope.students_done = false; $scope.schedules_done = false;
        
        var email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        var phone = /^\d{9}$/; var school = /^[0-9a-fA-F]{24}$/; var time = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

        $scope.validate_courses = function() {
            var data = 'cursos';
            //console.log('validating courses', $scope.data[data]);
            //debugger;

            if(!$scope.data.hasOwnProperty(data)){
                $scope.message = 'O documento não possui uma folha com cursos';
                return false;
            }
            var keys = ['curso','nome','apelido','email','telefone','descricao'];
            //console.log(data,$scope.data[data].length);

            for( var i = 0; i < $scope.data[data].length; i++ ) {

                var temp = $scope.data[data][i];
                var fields = Object.keys(temp);
                
                for (var j = 0; j < keys.length; j++) {
                    if(fields.indexOf(keys[j]) == -1 || !temp[keys[j]]){$scope.message = 'Campo inexistente ou vazio: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'telefone' && !phone.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'telefone_professor' && !phone.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'telefone_encarregado' && !phone.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'email_encarregado' && !email.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'email' && !email.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'time' && !time.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                };

                //console.log('validated course fields', temp);

                if($scope.existing_courses.hasOwnProperty(temp.curso)){$scope.message = 'O curso '+temp.curso+' já existe.'; return false;}
                
                //console.log('course is unique', $scope.existing_courses);

                $scope.courses[temp.curso] = {
                                    name: temp.curso, school: $scope.id, description: temp.descricao,
                                    supervisor: { firstname: temp.nome, lastname: temp.apelido, email: temp.email, phone: temp.telefone }
                            };
            }
            //console.log('validated courses', $scope.data[data]);
            $scope.courses_valid = true;
            return $scope.validate_subjects();
        };

        $scope.insertCourses = function() {
            var promises = [];
            var courses = {};
                angular.forEach($scope.courses, function(value, key) {
                    promises.push(CourseService.save(value,function(response){ courses[response.name] = response; }).$promise);
                });
            
            $q.all(promises).then(function(){
                    $scope.courses_done = true;
                    return $scope.insertSubjects(courses);
                
            });
        };

        $scope.validate_subjects = function() {
            //Assume $scope.courses is ready
            var data = 'disciplinas';
            //console.log('validating subjects', $scope.data[data]);

            if(!$scope.data.hasOwnProperty(data)){$scope.message = 'O documento não possui uma folha de disciplinas'; return false;}
            var keys = ['disciplina','curso','ano','descricao'];

            for( var i = 0; i < $scope.data[data].length; i++ ) {
                var temp = $scope.data[data][i];
                var fields = Object.keys(temp);
                
                for (var j = 0; j < keys.length; j++) {
                    if(fields.indexOf(keys[j]) == -1 || !temp[keys[j]]){$scope.message = 'Campo inexistente ou vazio: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'telefone' && !phone.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'telefone_professor' && !phone.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'telefone_encarregado' && !phone.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'email_encarregado' && !email.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'email' && !email.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'time' && !time.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                };
                
                if(temp.ano < 1 || temp.ano > 5){$scope.message = 'Erro na disciplina de '+temp.disciplina+': use apeas anos de 1 a 5'; return false;}
                //console.log('validated subject fields', temp);

                //Ensure course exists
                if(!$scope.existing_courses.hasOwnProperty(temp.curso) && !$scope.courses.hasOwnProperty(temp.curso)){
                    $scope.message = 'Erro na disciplina de '+temp.disciplina+': o curso de '+temp.curso+' não existe';
                    return false;
                }

                //Ensure subject does not yet exist for this course
                if($scope.existing_subjects.hasOwnProperty(temp.curso+'_'+temp.disciplina)){
                    $scope.message = 'Erro: a disciplina de '+temp.disciplina+' já existe';
                    return false;
                }
                
                $scope.subjects[temp.curso+'_'+temp.disciplina] = {name: temp.disciplina, school: $scope.id, description: temp.descricao, year: temp.ano, course: temp.curso };
            }
            
            //console.log('validated subjects', $scope.data[data]);
            $scope.subjects_valid = true;
            return $scope.validate_professors();
        };    
        
$scope.insertSubjects = function(courses) {
            //Assume courses have already been inserted
            $scope.existing_courses = courses;

            var subjects = {};
            var promises = [];
                //Check if I really have the course ID
                //console.log('Courses',$scope.existing_courses);
                angular.forEach($scope.subjects, function(value, key) {
                    var course = value.course;
                    value.course = $scope.existing_courses[course];
                    promises.push(SubjectService.save(value,function(response){
                        //console.log(response);
                        subjects[course+'_'+response.name] = response;
                    }).$promise);
                });
            
            $q.all(promises).then(function(){
                $scope.subjects_done = true;
                return $scope.insertProfessors(courses, subjects);
            });
        };

        $scope.validate_professors = function() {
            var data = 'professores';
            //console.log('validating professors', $scope.data[data]);
            if(!$scope.data.hasOwnProperty(data)){ return false;}
            var keys = ['nome','apelido','email','telefone','descricao'];

            for( var i = 0; i < $scope.data[data].length; i++ ) {
                var temp = $scope.data[data][i];
                var fields = Object.keys(temp);
                
                for (var j = 0; j < keys.length; j++) {
                    if(fields.indexOf(keys[j]) == -1 || !temp[keys[j]]){$scope.message = 'Campo inexistente ou vazio: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'telefone' && !phone.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'telefone_professor' && !phone.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'telefone_encarregado' && !phone.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'email_encarregado' && !email.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'email' && !email.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'time' && !time.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                };

                
                if($scope.existing_users.hasOwnProperty(temp.telefone)){
                    $scope.message = 'Erro: o telefone'+temp.telefone+': do professor '+temp.nome+' '+temp.apelido+' já existe';
                    return false;
                }
                if($scope.existing_emails.hasOwnProperty(temp.email)){
                    $scope.message = 'Erro: o email'+temp.email+': do professor '+temp.nome+' '+temp.apelido+' já existe';
                    return false;
                }
                
                $scope.professors[temp.telefone] = {
                    firstname: temp.nome,
                    lastname: temp.apelido,
                    school: $scope.id,
                    phone: temp.telefone,
                    email: temp.email,
                    bio: temp.descricao,
                    type: 'professor',
                    password: randomString()
                };
            }
            //console.log('validated professors', $scope.data[data]);
            $scope.professors_valid = true;
            return $scope.validate_schedules();
        };    

        $scope.insertProfessors = function(courses, subjects) {
            var users = {};
            var promises = [];
                //Check if I really have the course ID
                angular.forEach($scope.professors, function(value, key) {
                    promises.push(AuthService.register.save(value,function(response){
                        //console.log(response);
                        users[response.phone] = response;
                    }).$promise);
                });
            
            $q.all(promises).then(function(){
                $scope.professors_done = true;
                return $scope.insertSchedules(users, courses, subjects);
            });
        };

        $scope.validate_schedules = function() {
            //Assume $scope.professors, $scope.courses and $scope.subjects are ready
            var data = 'horarios';
            //console.log('validating schedules', $scope.data[data]);
            if(!$scope.data.hasOwnProperty(data)){ return false;}
            var keys = ['curso','disciplina','telefone_professor','segunda1','segunda2','terca1','terca2','quarta1','quarta2','quinta1','quinta2','sexta1','sexta2'];
            

            //course,subject,phone,08:00,10:00,00:00,00:00,08:00,10:00,08:00,10:00,08:00,10:00
            for( var i = 0; i < $scope.data[data].length; i++ ) {
                var temp = $scope.data[data][i];
                var fields = Object.keys(temp);
                var subject = {};
                var course = {};
                var professor = {};
                
                for (var j = 0; j < keys.length; j++) {
                    if(fields.indexOf(keys[j]) == -1 || !temp[keys[j]]){$scope.message = 'Campo inexistente ou vazio: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'telefone' && !phone.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'telefone_professor' && !phone.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'telefone_encarregado' && !phone.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'email_encarregado' && !email.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'email' && !email.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'time' && !time.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                };
                
                //console.log('validated schedule fields', temp);
                
                //Ensure professor exists
                if($scope.existing_users.hasOwnProperty(temp.telefone_professor)){
                    professor = $scope.existing_users[temp.telefone_professor];
                }else if($scope.professors.hasOwnProperty(temp.telefone_professor)){
                    professor = $scope.professors[temp.telefone_professor];
                }else{
                    $scope.message = 'Erro (Horários): não existe nenhum professor com o telefone '+temp.telefone_professor;
                    return false;
                }

                //console.log('validated schedule professor', temp);

                //Ensure subject
                if($scope.existing_subjects.hasOwnProperty(temp.curso+'_'+temp.disciplina)){
                    subject = $scope.existing_subjects[temp.curso+'_'+temp.disciplina];
                }else if($scope.subjects.hasOwnProperty(temp.curso+'_'+temp.disciplina)){
                    subject = $scope.subjects[temp.curso+'_'+temp.disciplina];
                }else{
                    $scope.message = 'Erro (Horários): não existe nenhuma disciplina chamada '+temp.disciplina;
                    return false;
                }

                //console.log('validated schedule subject', temp);

                //Ensure course
                if($scope.existing_courses.hasOwnProperty(temp.curso)){
                    course = $scope.existing_courses[temp.curso];
                }else if($scope.courses.hasOwnProperty(temp.curso)){
                    course = $scope.courses[temp.curso];
                }else{
                    $scope.message = 'Erro (Horários): não existe nenhum curso chamado '+temp.curso;
                    return false;
                }

                
                //console.log('validated schedule course', temp);

                var temp_schedule = {
                    subject: temp.disciplina,
                    professor: temp.telefone_professor,
                    school: $scope.id,
                    course: temp.curso,
                    absences: [],
                    schedule: {
                        monday: {start: temp.segunda1,end: temp.segunda2},
                        tuesday: {start: temp.terca1,end: temp.terca2},
                        wednesday: {start: temp.quarta1,end: temp.quarta2},
                        thursday: {start: temp.quinta1,end: temp.quinta2},
                        friday: {start: temp.sexta1,end: temp.sexta2}
                    }
                };

                var weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
                var temp2 = new Date();
                var offset = -60;

                if(temp2.getTimezoneOffset() == offset){ var today = temp2;}else{
                    var utc = temp2.getTime() + (temp2.getTimezoneOffset() * 60000);
                    var today = new Date(utc - (3600000*offset));
                }

                var schedule = temp_schedule.schedule;
                var first_start = new Date($scope.school.semesters.first.start);
                var first_end = new Date($scope.school.semesters.first.end);
                var second_start = new Date($scope.school.semesters.second.start);
                var second_end = new Date($scope.school.semesters.second.end);
                var locale = today.toLocaleString();
                
                if(today < first_end){
                    var start = first_start;
                    var end = first_end;
                } else if (today >= first_end && today < second_end ){
                    var start = second_start;
                    var end = second_end;
                }

                var sessions = [];
                
                for (var k = 1; k <= 5; k++) {
                    var weekday = weekdays[j];
                    
                        if (schedule.hasOwnProperty(weekday) && schedule[weekday].start != '' && schedule[weekday].end != '') {

                            var start_weekday = start.getDay(); //index
                            var session_weekday = weekdays.indexOf(weekday);
                            var diff = (start_weekday < session_weekday)? session_weekday - start_weekday : start_weekday - session_weekday + 7;

                            var start_str = schedule[weekday].start.split( ":" );
                            var end_str = schedule[weekday].end.split( ":" );
                            var session_date = new Date(start.getFullYear(),start.getMonth(),start.getDate(),start_str[0],start_str[1]);
                            var start_date = new Date(session_date.setTime( session_date.getTime() + diff * 86400000 ));
                            var current = start_date;
                            var next = new Date(session_date.setTime( session_date.getTime() + 7 * 86400000 ));
                            //create professor absences until temp date + 7 is greater than end date
                            
                            var absence = {
                                    user: temp_schedule.professor,
                                    phone: temp_schedule.professor,
                                    school: $scope.id,
                                    year: subject.year,
                                    schedule: '',
                                    type: 'professor',
                                    course: course.name,
                                    subject: subject.name,
                                    supervisor_phone: course.supervisor.phone,
                                    message:'O professor '+professor.firstname+' '+professor.lastname+' faltou à aula de '+subject.name,
                                    supervisor_message: 'O professor '+professor.firstname+' '+professor.lastname+' faltou à aula de '+subject.name,
                                    time: []
                                };

                            while( next <= end ){
                                var current_locale = current.toLocaleString();
                                var message = 'O professor '+professor.firstname+' '+professor.lastname+' faltou à aula de '+subject.name;
                                var supervisor_message = 'O professor '+professor.firstname+' '+professor.lastname+' faltou à aula de '+subject.name;
                                var end_time = current;
                                end_time.setHours(parseInt(end_str[0]), parseInt(end_str[1]));
                                absence.time.push({ start: current, end: end_time, late: 20, message: message, supervisor_message: supervisor_message });

                                var current = next;
                                var next = new Date(current.setTime( current.getTime() + 7 * 86400000 ));
                            }

                            temp_schedule.absences.push(absence);
                        }
                }
                
                $scope.schedules[temp_schedule.course+'_'+temp_schedule.subject+'_'+temp_schedule.professor] = temp_schedule;
            }
            //console.log('validated schedules', $scope.data[data]);
            $scope.schedules_valid = true;
            return $scope.validate_students();
        };
        
        $scope.insertSchedules = function(users, courses, subjects) {
            //Assume courses, subjects and professors have been inserted
            $scope.existing_users = users;
            $scope.existing_subjects = subjects;
            $scope.existing_courses = courses;
            //console.log('Schedule Users',users);
            //course,subject,email,08:00,10:00,00:00,00:00,08:00,10:00,08:00,10:00,08:00,10:00
            var promises = [];
                //Check if I really have the course ID
                angular.forEach($scope.schedules, function(schedule, key) {
                    var absences = schedule.absences;
                    //console.log(absences);
                    delete schedule.absences;

                    //Get subject, professor and course ids
                    schedule.professor = $scope.existing_users[schedule.professor];
                    schedule.subject = $scope.existing_subjects[schedule.course+'_'+schedule.subject];
                    schedule.course = $scope.existing_courses[schedule.course];
                    promises.push(ScheduleService.save(schedule,function(response){
                        console.log(response);

                        for(var j = 0; j < absences.length; j++){
                            //Get user, course, subject ids
                            absences[j].schedule = response._id;
                            absences[j].user = response.professor;
                            absences[j].subject = response.subject;
                            absences[j].course = response.course;
                            AbsenceService.save(absences[j],function(response){ console.log(response)},function(error){ console.log(error)});
                        }
                    }).$promise);
                });
           
            $q.all(promises).then(function(){
                StorageService.load();
                $scope.schedules_done = true;
                return $scope.insertStudents(users, courses);
            });
        };
        
        $scope.validate_students = function() {
            //Assume $scope.courses is ready
            var data = 'estudantes';
            //console.log('validating students', $scope.data[data]);

            if(!$scope.data.hasOwnProperty(data)){ return false;}
            var keys = ['nome','apelido','email','telefone','nome_encarregado','apelido_encarregado','email_encarregado','telefone_encarregado','curso','ano'];

            for( var i = 0; i < $scope.data[data].length; i++ ) {
                var temp = $scope.data[data][i];
                var fields = Object.keys(temp);
                
                for (var j = 0; j < keys.length; j++) {
                    if(fields.indexOf(keys[j]) == -1 || !temp[keys[j]]){$scope.message = 'Campo inexistente ou vazio: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'telefone' && !phone.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'telefone_professor' && !phone.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'telefone_encarregado' && !phone.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'email_encarregado' && !email.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'email' && !email.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                    if(keys[j] == 'time' && !time.test(temp[keys[j]])){$scope.message = 'Campo inválido: tabela ['+data+'], fila ['+i+'], coluna: ['+keys[j]+']';return false;}
                };
                
                if(temp.ano < 1 || temp.ano > 5){ return false;}
                
                //Ensure course exists
                if(!$scope.existing_courses.hasOwnProperty(temp.curso) && !$scope.courses.hasOwnProperty(temp.curso)){ return false; }

                //Ensure user does not yet exist
                if($scope.existing_users.hasOwnProperty(temp.telefone)){
                    $scope.message = 'Erro: o telefone'+temp.telefone+': do estudante '+temp.nome+' '+temp.apelido+' já existe';
                    return false;
                }
                if($scope.existing_emails.hasOwnProperty(temp.email)){
                    $scope.message = 'Erro: o email'+temp.email+': do estudante '+temp.nome+' '+temp.apelido+' já existe';
                    return false;
                }
                
                $scope.students[temp.telefone] = {
                        firstname: temp.nome, lastname: temp.apelido, school: $scope.id, course: temp.curso, phone: temp.telefone, email: temp.email, type: 'student',
                        year: temp.ano, supervisor:{firstname: temp.nome_encarregado, lastname: temp.apelido_encarregado,email: temp.email_encarregado,
                        phone: temp.telefone_encarregado},password: randomString()
                };
            }

            //console.log('validated students', $scope.data[data]);
            $scope.students_valid = true;
            return $scope.students_valid;
        }; 

        $scope.insertStudents = function(users, courses) {
            
            $scope.existing_users = users;
            $scope.existing_courses = courses;
            var promises = [];
            //Assume courses exist
                angular.forEach($scope.students, function(student, key) {
                    student.course = $scope.existing_courses[student.course];
                    promises.push(UserService.save(student,function(response){console.log(response);}).$promise);
                });
            $q.all(promises).then(function(){
                $scope.students_done = true;
                return $scope.students_done;
            });
        };              
        
    var XLX = XLSX;
    $scope.process = function (data) {
        var workbook = XLS.read(data, {type: 'base64'});
        var output = $scope.to_json(workbook);
        return output;
    };


    $scope.to_json = function (workbook) {
        var result = {};
        workbook.SheetNames.forEach(function(sheetName) {
            var roa = XLS.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            if(roa.length > 0){
                result[sheetName] = roa;
            }
        });
    return result;
    };


        
        
        $scope.canSubmit = function(event) {
            $scope.runs+=1;
            
            $scope.valid = false;
            var formats = ['application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            if(event.target.files.length == 0){ return false; }
            var file = event.target.files[0];
            
            if(typeof file == 'undefined' || !('type' in file)){
                $scope.form_error = true;
                $scope.message = 'Ficheiro corrompido.';
                return false;
            };
            
            var type = file.type;
            
            if(formats.indexOf(type) == -1){
                $scope.message = 'Formato de ficheiro não suportado. Use apenas .XLS ou .XLSX';
                $scope.form_error = true;
                return false;
            }
            var reader  = new FileReader();
            
            //console.log('File',file);
            
            reader.onload = function(event) {
            
            //console.log('Base64 Data',event.target.result);
            $scope.blob = event.target.result.split(',');
            if($scope.blob.length != 2){
                $scope.form_error = true;
                $scope.message = 'Houve um problema ao processar o ficheiro.';
                return false;
            }
            
            $scope.blob = $scope.blob[1];
            //return false;
            //$scope.encoded = $base64.encode(unescape(encodeURIComponent($scope.file2)));

            //console.log('Encoded Data',$scope.blob);
            try {
                $scope.data = $scope.process($scope.blob);
            }
            catch(err) {
                $scope.form_error = true;
                $scope.message = 'Formato de ficheiro não suportado.';
                return false;
            }
            
            //console.log('JSON Data',$scope.data);
            //console.log('JSON type', typeof $scope.data);
            //return false;
            
            //console.log('checking file',$scope.data);
            //console.log('found data',$scope.data);

            var keys = ['cursos','disciplinas','professores','horarios','estudantes'];
            var fields = Object.keys($scope.data);

            //console.log('available fields',fields);
            
            
            for (var i = 0; i < keys.length; i++) {
                //console.log('Validating ',keys[i]);
                if(fields.indexOf(keys[i]) == -1 || $scope.data[keys[i]].length == 0 ){
                    $scope.message = 'O documento precisa de folhas com os nomes cursos, disciplinas, professores, horarios e estudantes';
                    $scope.form_error = true;
                    return false;
                }
                //console.log('Validated ',keys[i]);
            };

            $scope.valid = $scope.validate_courses();
            $scope.form_error = false;
            $scope.$apply();
            };
            reader.readAsDataURL(file);
        };    
        
        $scope.submitForm = function() {
            var done = $scope.insertCourses();
            $scope.$watch('students_done', function(newValue, oldValue) {
                var promises = StorageService.load();

                $q.all(promises).then(function(){
                    if(newValue){ $location.url('/page/profile/'+StorageService.me().type); }
                });
                
            });
        };
                            //CODE END
                        }, function(error) { $scope.message = "Não Existem Utilizadores"; } );
                    }, function(error) { $scope.message = "Não Existem Disciplinas."; } );
                }, function(error) { $scope.message = "Não Existem Cursos"; } );
            },
            function(error) {
                $scope.message = "Escola inválida.";
            }
        );
        
    }



})();


