const metrics = []

metrics.push({compute: () => console.log("import sucess")})

metrics.push({name:"Ex", compute:computeExample, conditions:{}, highlight_settings: {label:"Ex",color_extent_min: 0,color_extent_max: 1000}, full_name: "Example"})

function computeExample(mod1,mod2, id_set){

    mod1.traverse(mod1.data,addLabelExample)

    mod2.traverse(mod2.data,addLabelExample)


    function addLabelExample( node, children){
        node.extended_informations['Ex/' + mod1.uid + '-' + mod2.uid] = Math.round(Math.random() * 1000)
    }

    return Math.round(Math.random() * 10)
}

export {metrics}