
var NUTELLA = require('nutella_lib');

// Get configuration parameters and init nutella
var cliArgs = NUTELLA.parseArgs();
var componentId = NUTELLA.parseComponentId();
var nutella = NUTELLA.init(cliArgs.broker, cliArgs.app_id, cliArgs.run_id, componentId);
// Optionally you can set the resource Id
//nutella.setResourceId('my_resource_id');

var portals = nutella.persist.getJsonObjectStore('portals');
portals.load();
if (!portals.hasOwnProperty('topID')){
    portals = {topID: 30, portalList: 
        [

            // ID < 10 reserved for administrative (activity-independent) portals
            // ID = 1 reserved for designer

            {ID:1,name:"designer"},
            {ID:2,name:"manager"},
            {ID:3,name:"developer"},
            {ID:4,name:"researcher"},

            // 10 <= ID < 20 reserved for instructor portals

            {ID:10,name:"teacher"},

            // 20 <= ID < 30 reserved for learner portals


            {ID:20,name:"student"},
            {ID:21,name:"group"}

            // 30 <= ID reserved for public portals

        ]
    };
    portals.save();
};

var instances = nutella.persist.getJsonObjectStore('instances');
instances.load();
if (!instances.hasOwnProperty('data')){ 
    instances = {
        data:[
            {portalID:1,topID:1,instanceList:[{ID:1,name:'designer'}]},
            {portalID:2,topID:1,instanceList:[{ID:1,name:'manager'}]},
            {portalID:3,topID:1,instanceList:[{ID:1,name:'developer'}]},
            {portalID:4,topID:1,instanceList:[{ID:1,name:'researcher'}]},

            {portalID:10,topID:1,instanceList:[{ID:1,name:'teacher name'}]},

            {portalID:20,topID:1,instanceList:[{ID:1,name:'student name'}]},
            {portalID:21,topID:1,instanceList:[{ID:1,name:'group name'}]}
        ]
    };
    instances.save();

};

var activities = nutella.persist.getJsonObjectStore('activities');
activities.load();
if (!activities.hasOwnProperty('topID')){
    activities = {topID: 1, activityList: [{ID:1,name:"planning"}]};
    activities.save();
};

var resources = nutella.persist.getJsonObjectStore('resources');
resources.load();
if (!resources.hasOwnProperty('topID')){
    resources = {topID: 300, resourceList: [

        // ID < 100 reserved for designer, unavailable for editing

        {ID:1,name:'portals',description:'portals',link:'portals',query:''},
        {ID:2,name:'resources',description:'resources',link:'resources',query:''},
        {ID:3,name:'activities',description:'activities',link:'activities',query:''},
        {ID:4,name:'design',description:'design',link:'design',query:''},
        {ID:5,name:'instances',description:'instances',link:'instances',query:''},
        {ID:6,name:'unitname',description:'unitname',link:'unitname',query:''},

        // 100 <= ID <200 reserved for administrators and teacher, unavailable for editing

        {ID:100,name:'portal',description:'portal',link:'portal',query:'&version=0'}, // portal selector for developer
        {ID:101,name:'portal',description:'portal',link:'portal',query:'&version=1'}, // portal selector for managers
        {ID:102,name:'portal',description:'portal',link:'portal',query:'&version=2'}, // portal selector for developers
        {ID:103,name:'portal',description:'portal',link:'portal',query:'&version=3'}, // portal selector for researchers
        {ID:104,name:'portal',description:'portal',link:'portal',query:'&version=4'}, // portal selector for teachers
        {ID:105,name:'portal',description:'portal',link:'portal',query:'&version=5'}, // portal selector for students
        {ID:106,name:'portal',description:'portal',link:'portal',query:'&version=6'}, // portal selector for groups
        {ID:107,name:'portal',description:'portal',link:'portal',query:'&version=7'}, // portal selector for students and groups
        {ID:108,name:'portal',description:'portal',link:'portal',query:'&version=8'}, // public selector for public portals

        // 200 <= ID < 300 for specialized portals

        {ID:200,name:'activity',description:'activity',link:'activity',query:''}

    ]};

    resources.save();
};


var design = nutella.persist.getJsonObjectStore('design');
design.load();
if (!design.hasOwnProperty('data')){
    design = {data:[

        // designer 

        {portalID:1,activityID:0,resourceID:1},
        {portalID:1,activityID:0,resourceID:2},
        {portalID:1,activityID:0,resourceID:3},
        {portalID:1,activityID:0,resourceID:4},
        {portalID:1,activityID:0,resourceID:5},
        {portalID:1,activityID:0,resourceID:6},
        {portalID:1,activityID:0,resourceID:200},

        // manager 

        {portalID:2,activityID:0,resourceID:200},

        // developer 

        {portalID:3,activityID:0,resourceID:200},

        // researcher 


        // teacher 

        {portalID:10,activityID:1,resourceID:200},

        // student 


        // group 


    ]};
    design.save();
};

var activity = nutella.persist.getJsonObjectStore('activity');
activity.load();
if (!activity.hasOwnProperty('ID')){
    activity = {ID:1,name:"planning"};
    activity.save();
};


var unitname = nutella.persist.getJsonObjectStore('unitname');
unitname.load();
if (!unitname.hasOwnProperty('name')){
    unitname = {name:"unit"};
    unitname.save();
};



console.log ('Completed initialization. Read Portals, Activities, Resources, Design, Activity, and Unit name');
console.log ('Listening for requests');

// all files loaded

// open request handlers

// these are used primarily by the distribution editor



nutella.net.handle_requests('get_portals', function (message, from){
    return (portals);
});
nutella.net.handle_requests('get_instances', function (message, from){
    return (instances);
});
nutella.net.handle_requests('get_activities', function (message, from){
    return (activities);
});
nutella.net.handle_requests('get_resources', function (message, from){
    return (resources);
});
nutella.net.handle_requests('get_design', function (message, from){
    return (design);
});
nutella.net.handle_requests('get_activity', function (message, from){
    return (activity);
});
nutella.net.handle_requests('get_unitname', function (message, from){
    return (unitname);
});

//  nutella bug? workaround: must redefine and reload json objects prior to saving them
//  

nutella.net.subscribe('set_portals', function (message, from){
    portals = nutella.persist.getJsonObjectStore('portals');
    portals.load();
    portals = message.portals;
    portals.save();
    instances = nutella.persist.getJsonObjectStore('instances');
    instances.load();
    instances = message.instances;
    instances.save();
    nutella.net.publish('portals_set',portals);
    // nutella.net.publish('portals_set',message);
});

nutella.net.subscribe('set_instances', function (message, from){
    instances = nutella.persist.getJsonObjectStore('instances');
    instances.load();
    instances = message;
    instances.save();
    nutella.net.publish('instances_set',instances);
    // nutella.net.publish('portals_set',message);
});
nutella.net.subscribe('set_activities', function (message, from){
    activities = nutella.persist.getJsonObjectStore('activities');
    activities.load();
    activities = message;
    activities.save();
    nutella.net.publish('activities_set',activities);

    // nutella.net.publish('activities_set',message);
});
nutella.net.subscribe('set_resources', function (message, from){
    resources = nutella.persist.getJsonObjectStore('resources');
    resources.load();
    resources = message;
    resources.save();
    nutella.net.publish('resources_set',resources);
    // nutella.net.publish('resources_set',message);
});
nutella.net.subscribe('set_design', function (message, from){
    design = nutella.persist.getJsonObjectStore('design');
    design.load();
    design = message;
    design.save();
    nutella.net.publish('design_set',design);
    // nutella.net.publish('design_set',message);
});
nutella.net.subscribe('set_activity', function (message, from){
    activity = nutella.persist.getJsonObjectStore('activity');
    activity.load();
    activity = message;
    activity.save();
    nutella.net.publish('activity_set',activity);
});
nutella.net.subscribe('set_unitname', function (message, from){
    unitname = nutella.persist.getJsonObjectStore('unitname');
    unitname.load();
    unitname = message;
    unitname.save();
    nutella.net.publish('unitname_set',unitname);
    // nutella.net.publish('unitname_set',message);
});






