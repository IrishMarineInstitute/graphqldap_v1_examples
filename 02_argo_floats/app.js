  GraphqlDAPv1.prototype.getLatestArgoFloats = function(){
  
  var query =  [
      "# @title: Latest Argo Floats",
      "# @author: Rob Fuller",
      "# @link: ",
      "# @description: ",
      "#      ",
      "#      Time and place of when platform last seen in past 6 months.",
      "#      ",
      "#      ",
      "{",
      "  argoFloats(since: \"6 months ago\", last: 1, groupby:\"platform_number\"){",
      "      platform_number",
      "      project_name",
      "      time",
      "      latitude",
      "      longitude",
      "  }",
      "}"
    ].join("\n");
  var variables = {  };
  if( arguments.length === 1 &&
      typeof arguments[0] === 'object' &&
      arguments[0].hasOwnProperty('platform_number')){
    variables = {};
    var varnames = [
];
    varnames.forEach(function(params,varname){
       if(params.hasOwnProperty(varname)){
         variables[varname] = params[varname];
       };
    }.bind(null,arguments[0]));
  }
  var operationName = null;
  var endPoint = "/imi/argoFloats"

  return this.$fetch(query, variables, operationName, endPoint);
}

  function handle_myFunction_errors(errors){
  }
  function handleLatestArgoFloatsData(data){
     var tbody = document.getElementById('tbody');
     tbody.innerHTML = "";
    data.argoFloats.sort(function(a,b){
      return b.time.localeCompare(a.time)
    });
    data.argoFloats.forEach(function(e){
      var tr = document.createElement("tr");
      var td = document.createElement("td");
      td.appendChild(document.createTextNode(e.platform_number));
      tr.appendChild(td);
      td = document.createElement("td");
      td.appendChild(document.createTextNode(e.project_name));
      tr.appendChild(td);
      td = document.createElement("td");
      td.appendChild(document.createTextNode(e.time.substring(0,10)));
      tr.appendChild(td);
      td = document.createElement("td");
      td.appendChild(document.createTextNode(e.latitude+", "+e.longitude));
      tr.appendChild(td);
      tbody.appendChild(tr);

    });
  }
