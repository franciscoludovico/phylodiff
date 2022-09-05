import Container from './container.js'
//const { compute_visible_topology_similarity } = require('./comparison.js')
const { build_table, reroot_hierarchy, screen_shot } = require('./utils.js')
import keyboardManager from './keyboardManager.js'
import FileSaver from 'file-saver' ;
import Interface from "./interface";
var BitSet = require('bitset')
var HashMap = require('hashmap')
var default_metrics = require('./metric_modules/default_metrics')
// class to handle user interaction to init and set up phyloIO instance

export default class API { // todo ultime ! phylo is used ase reference from .html not goood

    constructor() {
        this.containers = {}; // {container id -> Container() }
        this.last_models = {
            'container0' : -1,
            'container1' : -1,
            'results_id' : function (){return '' +this.container0 + '-' + this.container1 }
        }
        this.bound_container = []
        this.session_token = null
        this.session_url = null
        this.phylo_embedded = false
        this.leaf_info = {
            'intersect' : false,
            'include' : false
        }
        this.distance = new HashMap()
        this.settings = {
            'phylostratigraphy' : false,
            'share_phylo': 'https://zoo.vital-it.ch/viewer/',
            'share_post': 'https://zoo.vital-it.ch/sharing/create/',
            'share_get': 'https://zoo.vital-it.ch/sharing/load/?session=',
            'no_distance_message': true,
            'compute_metrics':false,
            'sync_zoom': false,
            'syncing_zoom': false,
            "compareMode" : false, // compare for each pair of tree topological similarity
        };
        this.undoing = false;
        this.id_set = {};
        this.metrics = default_metrics.metrics
    }

    reset(){ // !!!! KEEP ATTR UPDATED BETWEEN init and reset TODO AUTO THAT

        //remove tooltips
        for (const [uid, container] of Object.entries(this.containers)) {
            if (container.interface && container.interface.tooltip_add_tree){
                container.interface.tooltip_add_tree.tip.remove()
            }
        }

        this.containers = {}; // {container id -> Container() }
        this.bound_container = []
        this.session_token = null
        this.session_url = null
        this.phylo_embedded = false
        this.distance = new HashMap();
        let default_settings = {
            'no_distance_message': true,
            'compute_distance': false,
            "compareMode" : false, // compare for each pair of tree topological similarity
        };
        this.settings = {...this.settings, ...default_settings};
        this.undoing = false;

    }



    // create and return a new container and add it the dict using its div id
    create_container(container_id){ // container_id -> str
        let c = new Container(container_id);
        this.containers[container_id] = c;

        if (this.bound_container.length < 2) {this.bound_container.push(c)}
        return c;
    }

    // start the app by computing required information and starting each container
    start(recompute=false){


        var cs = Object.entries(this.containers)

        for (const [uid, container] of cs) {
            container.start(true)
        }

        var con1 = this.bound_container[0]
        var con2 =  this.bound_container[1]

        if (this.settings.compareMode && con1.models.length > 0 && con2.models.length > 0 ){

            //compute_visible_topology_similarity(recompute)

            for (const [uid, container] of cs) {
                container.viewer.render(container.viewer.hierarchy);
                container.viewer.update_collapse_level(container.models[container.current_model].settings.collapse_level)
            }

            /*if (this.settings.compute_distance){
                this.compute_distance()
            }*/
        }

        new keyboardManager(this);
    }

    get_json_pickle(){

        var pickle = {
            "containers" : [],
            'settings' : this.settings
        }

        let cs = Object.values(this.containers)

        for (var i = 0; i < cs.length; i++) {

            let ms = cs[i].models

            let minput = []

            for (var j = 0; j < ms.length; j++) {

                var s = ms[j].settings
                s.labels_array = [...s.labels];
                s.colorlabels_array = [...s.colorlabels];
                minput.push({'settings':s, 'data':ms[j].remove_circularity(), 'zoom': ms[j].zoom })


            }

            pickle.containers.push({
                'models' : minput,
                'settings'  : cs[i].settings,
                'current_model': cs[i].current_model
            })

        }

        var string_pickle = JSON.stringify(pickle);

        for (var i = 0; i < cs.length; i++) {

            let ms = cs[i].models

            for (var j = 0; j < ms.length; j++) {

                ms[j].add_circularity_back()


            }

        }

        return string_pickle

    }

    save_session(){ // TODO not working since collapse or other info are store in circular data

        var blob = new Blob([this.get_json_pickle()], {type: "text/plain;charset=utf-8"});
        FileSaver.saveAs(blob, "Session.phyloio");

    }


    async lookup_custom_metrics(filename) {
        const {metrics} = await import("./metric_modules/" + filename + ".js")
        metrics.forEach( metric => {
            if(metric.hasOwnProperty("name") && metric.hasOwnProperty("compute") && metric.hasOwnProperty("compute") &&
                ((metric.hasOwnProperty("highlight_settings") && metric.hasOwnProperty("full_name")) || !metric.hasOwnProperty("highlight_settings"))){
                this.metrics.push(metric)
            }{
                //should be window with warning
                //if the custom metric doesn't meet the minimum requirements it won't be added
                console.log("Custom metric missing important properties!\n")
                console.log(metric)
            }
        })

    }

    compute_metrics(){
        if (this.bound_container[0].models.length == 0 || this.bound_container[1].length == 0) {
            return
        }

        const mod1 = this.bound_container[0].models[this.bound_container[0].current_model]
        const mod2 = this.bound_container[1].models[this.bound_container[1].current_model]

        if(mod1.uid !== this.last_models.container0 || mod2.uid !== this.last_models.container1){
            let deep_leaf_list_1 = mod1.deep_leaf_list
            let deep_leaf_list_2 = mod2.deep_leaf_list

            if (deep_leaf_list_2.length > deep_leaf_list_1.length) {
                let temp = deep_leaf_list_2
                deep_leaf_list_2 = deep_leaf_list_1
                deep_leaf_list_1 = temp
            }

            let id_set = new HashMap()
            let diff_counter = 0


            deep_leaf_list_1.forEach( (value) => id_set.set(value,id_set.size) )
            deep_leaf_list_2.forEach( (value) => {
                    if(!id_set.has(value)) {
                        id_set.set(value,id_set.size)
                        diff_counter++
                    }
                }
            )
            if(diff_counter == 0) {
                if (deep_leaf_list_1.length == deep_leaf_list_2.length) {
                    this.leaf_info.intersect = true
                }
                this.leaf_info.include = true
            }
            this.id_set = id_set
            this.last_models.container0 = mod1.uid
            this.last_models.container1 = mod2.uid
        }

        const available_metrics = this.metrics.filter(metric => {
                for(const condition in metric.conditions){
                    if(metric.conditions[condition] !== this.leaf_info[condition]) return false
                }
                return true
            }
        )

        available_metrics.forEach(metric => {
            this.distance[metric.full_name] = metric.compute(mod1,mod2,this.id_set)
            if(metric.hasOwnProperty('highlight_settings')){
                new_highlight_label(mod1,metric.highlight_settings)
                new_highlight_label(mod2,metric.highlight_settings)
                /*
                mod1.settings.style.color_accessor = metric.highlight_settings.label
                mod2.settings.style.color_accessor = metric.highlight_settings.label
                 */
            }
        } )

        /*
        this.bound_container[0].viewer.set_color_scale();
        this.bound_container[0].viewer.render(this.bound_container[0].viewer.hierarchy)
        this.bound_container[1].viewer.set_color_scale();
        this.bound_container[1].viewer.render(this.bound_container[1].viewer.hierarchy)
        */

        this.bound_container[0].interface = new Interface(this.bound_container[0].viewer,this.bound_container[0])
        this.bound_container[1].interface = new Interface(this.bound_container[1].viewer,this.bound_container[1])

        this.display_distance_window()

        function new_highlight_label(mod,highlight_settings) {
            var label = highlight_settings.label
            if(!mod.settings.labels.has(label)) {
                mod.settings.labels.add(label)
                mod.settings.colorlabels.add(label)
                mod.settings.style.color_extent_max[label] = highlight_settings.color_extent_max;
                mod.settings.style.color_extent_min[label] = highlight_settings.color_extent_min;
            }
        }

    }




    /*
    compute_distance(){


        if (!this.settings.compareMode){
            return
        }

        this.distance.clade = false
        this.distance.Cl_good = false
        this.distance.Cl_left = false
        this.distance.Cl_right = false
        this.distance.RF = false
        this.distance.RF_good = false
        this.distance.RF_left = false
        this.distance.RF_right = false
        this.distance.Euc = false

        if (this.bound_container[0].models.length == 0 || this.bound_container[1].length == 0) {
            return
        }

        var mod1 = this.bound_container[0].models[this.bound_container[0].current_model]
        var mod2 = this.bound_container[1].models[this.bound_container[1].current_model]

        // Sanity check common leaves set --> warning message

        var leaves1 = mod1.hierarchy_mockup.leaves().map(x => x.data.name);
        var leaves2 = mod2.hierarchy_mockup.leaves().map(x => x.data.name);
        var intersection = leaves1.filter(value => leaves2.includes(value));

        if (intersection.length == 0){
            this.settings.no_distance_message = "No leaves in common."
            this.distance.Euc = false
            this.distance.RF = false
            this.distance.clade = false

            if (this.phylo_embedded){
                this.display_distance_window()
            }

            return
        }




        // COMPUTE CLADE DISTANCE ON ACTUAL TOPOLOGY
        var r =  compute_RF_Euc(mod1.table,mod2.table)
        this.settings.no_distance_message = true
        this.distance.clade = r.RF
        this.distance.Cl_good = r.good
        this.distance.Cl_left = r.L
        this.distance.Cl_right = r.R


        // COMPUTE RF ON UNROOTED TREE


        // reroot both of them
        var hierarchy_mockup_rerooted1 = reroot_hierarchy(mod1.build_hierarchy_mockup(), intersection[0])
        var hierarchy_mockup_rerooted2 = reroot_hierarchy(mod2.build_hierarchy_mockup(), intersection[0])


        // build tables
        var X1 = build_table(hierarchy_mockup_rerooted1)
        var X2 = build_table(hierarchy_mockup_rerooted2)
        var r2 =  compute_RF_Euc(X1,X2)



        this.settings.no_distance_message = true

        this.distance.RF = r2.RF
        this.distance.RF_good = r2.good
        this.distance.RF_left = r2.L
        this.distance.RF_right = r2.R
        this.distance.Euc = r2.E


        if (this.phylo_embedded){
            this.display_distance_window()
        }




        function compute_RF_Euc(X1,X2){

            var n_good  = 0
            var euclidian = 0

            for (var i = 0; i < X1.table.length; i++) {
                var s1 = X1.table[i][0]
                var e1 = X1.table[i][1]
                var w1 = Math.abs(e1-s1)

                if (w1 > 0){

                    var species =  X1.I2S.slice(s1,e1+1)
                    var index = []

                    for (const [name, idx] of Object.entries(X2.S2I)) {
                        if (species.includes(name)) {index.push(idx)}
                    }

                    if (index.length <= 0) {
                        continue
                    }

                    var s2 = Math.min.apply(null,index)
                    var e2 = Math.max.apply(null,index)
                    var w2 = Math.abs(e2-s2)

                    if (w1 == w2) {

                        if (X2.table[e2][0] == s2 && X2.table[e2][1] == e2) {
                            n_good += 1
                            euclidian += Math.abs(parseFloat(X1.table[i][2]) - parseFloat(X2.table[e2][2]) )
                        }
                        else if (X2.table[s2][0] == s2 && X2.table[s2][1] == e2){

                            n_good += 1
                            euclidian += Math.abs(parseFloat(X1.table[i][2]) - parseFloat(X2.table[s2][2]) )

                        }
                        else{
                            euclidian += parseFloat(X1.table[i][2])
                            euclidian += parseFloat(X2.table[e2][2])

                        }

                    }

                    else{
                        euclidian += parseFloat(X1.table[i][2])
                        euclidian += parseFloat(X2.table[e2][2])
                    }




                }

            }

            return {
                'E':euclidian.toFixed(2),
                'RF': (X1.n_edges + X2.n_edges -2*n_good),
                'good':n_good,
                'L':X1.n_edges,
                'R':X2.n_edges,

            }
        }




    }

     */

    screen_shot(params){screen_shot(params)}

    generate_share_link(){

        var that = this
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {

            if (this.readyState != 4) return;

            if (this.status == 201) {
                var data = JSON.parse(this.responseText);

                if (data.result = 'OK'){
                    that.session_token = data.session
                    that.session_url = that.settings.share_phylo + '?session=' + that.session_token
                }
            }

            if (this.status == 400) {
                return
            }
        };

        xhr.open("POST", this.settings.share_post, false);

        xhr.setRequestHeader('Content-Type', 'application/json');

        var j = this.get_json_pickle()

        xhr.send(j);

}

    get_share_data(session_token, callback=null){


        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                var j = xhr.responseText;
                callback.apply(this,[j])
            }
        }

        xhr.open('GET', this.settings.share_get + session_token, false);
        xhr.send(null);



    }



    display_distance_window(){

        document.getElementById("distance_window").style.display  = (this.settings.compareMode ) ?  'block': 'none';

        var divdiv = document.getElementById("mydivbody");

        divdiv.innerHTML = "<ol class=\"list-group \">\n"
        for(const metric_name in this.distance) {
            divdiv.innerHTML += "<li class=\"list-group-item d-flex justify-content-between align-items-start\">\n" +
                "    <div class=\"ms-2 me-auto\">\n" +
                "      <div class=\"fw-bold\" style=\"text-align:left;\">{}</div></div>\n".format(metric_name) +
                "    <span class=\"badge bg-primary rounded-pill\">{}</span>\n".format(this.distance[metric_name]) +
                "  </li>"
        }

        if (this.settings.no_distance_message != true) {
            divdiv.innerHTML += "<li class=\"list-group-item d-flex justify-content-between align-items-start\">\n" +
                "    <div class=\"ms-2 me-auto\">\n" +
                "      <div class=\"fw-bold\" style=\"text-align:left;\"><strong>Warning:</strong> {}</div> </div>\n".format(this.settings.no_distance_message)
                "  </li>"
        }




        divdiv.innerHTML +=   "</ol>"


    }




}