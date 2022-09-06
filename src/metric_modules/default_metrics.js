const HashMap = require("hashmap");


const metrics = []
/*
* We decide which metrics can be calculated based on their leaf information
* R&F and Weighed R&F can be calculated if the leaf sets of both trees intersect themselves
* Generalized R&F can be calculated if the leaf sets of both trees don't intersect themselves and one of those
* sets is included in the other
* */

metrics.push(
    {
        name: "RDF",
        full_name: "Robinson-Foulds distance",
        compute: compute_RF_distance,
        description: "Under construction",
        conditions: {
            'intersect' : true
        },
        highlight_settings: {label:"RDF",color_extent_min: 0,color_extent_max: 1},
        ref: "link"
    }
)

metrics.push(
    {
        name: "WRF",
        full_name: "Weighted Robinson-Foulds",
        compute: compute_WRF_distance,
        description: "Under construction",
        conditions: {
            'intersect' : true
        },
        highlight_settings: {label:"Length",color_extent_min: null,color_extent_max: null},
        ref: "link"
    }
)

metrics.push(
    {
        name: "GRF",
        full_name: "Generalized Robinson-Foulds",
        compute: compute_GRF_distance,
        description: "Under construction",
        conditions: {
            'intersect' : false,
            'include' : true
        },
        highlight_settings: {label:"GRF",color_extent_min: 0,color_extent_max: 1},
        ref: "link"
    }
)

export {metrics}

/*
if(this.available_metrics.RDF && this.leaf_info.intersect) {
    this.distance.RF = compute_RF_distance(mod1, mod2, this.id_set)
}

if(this.available_metrics.WRF && this.leaf_info.intersect) {
    this.distance.WRF = compute_WRF_distance(mod1, mod2,this.id_set)
}

if(this.available_metrics.GRF && this.leaf_info.include && !this.leaf_info.intersect ) {
    this.distance.GRF = compute_GRF_distance(mod1, mod2, this.id_set)
}
 */

function compute_RF_distance(mod1, mod2, id_set) {
    const label = 'RDF/' + mod1.uid + "-" + mod2.uid
    var cl_tree1 = mod1.get_clusters_rf(id_set,label)
    var cl_tree2 = mod2.get_clusters_rf(id_set,label)

    var shared_clusters = 0
    const total_clusters = cl_tree1.size + cl_tree2.size

    /*
    * Comparing both cluster maps to check how similar they are
    * */
    var iterator = cl_tree2.values()
    cl_tree1.forEach(function (cluster1, key) {
        for (const cluster2 of iterator) {
            if (cluster2.bs.equals(cluster1.bs)) {
                shared_clusters++
                cluster1.node.extended_informations[label] = 1
                cluster2.node.extended_informations[label] = 1
                break
            }
        }
    })

    var rf_distance = -1

    /*
    * The number of shared clusters should not be bigger than the number of clusters of both trees
    * */
    if (shared_clusters * 2 < total_clusters) {
        rf_distance = (total_clusters - shared_clusters * 2) / 2
    }

    return rf_distance
}

function compute_WRF_distance(mod1, mod2, id_set) {

    let distance_map = new HashMap()

    var cl_tree1 = mod1.get_clusters_wrf(id_set, distance_map)
    var cl_tree2 = mod2.get_clusters_wrf(id_set, distance_map)

    var wrf_distance = 0

    distance_map.forEach(function (value, key) {
        wrf_distance += Math.abs(value)
    })

    return wrf_distance
}

function compute_GRF_distance(mod1, mod2, id_set) {

    const label = 'GRF/' + mod1.uid + "-" + mod2.uid
    var cl_tree1 = mod1.get_clusters_rf(id_set,label)
    var cl_tree2 = mod2.get_clusters_rf(id_set,label)
    var max_shared_clusters = cl_tree1.size

    if (cl_tree1.size > cl_tree2.size) {
        max_shared_clusters = cl_tree2.size
        let temp = cl_tree2
        cl_tree2 = cl_tree1
        cl_tree1 = temp
    }

    var shared_clusters = 0
    const total_clusters = cl_tree1.size + cl_tree2.size

    var iterator = cl_tree2.values()
    cl_tree1.forEach(function (cluster1, key) {
        for (const cluster2 of iterator) {
            if (cluster2.bs.equals(cluster1.bs)) {
                shared_clusters++
                cluster1.node.extended_informations[label] = 1
                cluster2.node.extended_informations[label] = 1
                break
            }
        }
    })

    var grf_distance = -1

    if (shared_clusters <= max_shared_clusters) {
        grf_distance = (total_clusters - shared_clusters * 2) / 2
    }

    return grf_distance
}
