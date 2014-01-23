(function() {
	var hops = [];
	var animate = true;

	// Data Loading
	$.get("data.csv").then(function(data) {
		var lines = data.match(/[^\r\n]+/g);
		var labels = lines.shift().split(",");
		_.each(lines, function(line) {
			var ll = line.split(",");
			var hop = {};
			for (var i = 0; i < ll.length; i++) {
				var k = labels[i];
				var v = ll[i];
				if (v.indexOf("-") > 0) {
					var s = v.split("-");
					v = {
						min : parseFloat(s[0]),
						max : parseFloat(s[1])
					};
					v.avg = (v.min + v.max) / 2;
					v.r = v.max - v.min;
				}
				hop[k] = v;
			}
			hop.variety = hop.variety + " " + hop.origin;
			hops.push(hop);
		});
		$sort.trigger("sort");
	});

	// Sorting
	var $sort = $("div.sort");
	$("div.sort > div").click(function(e) {
		if ($(e.currentTarget).hasClass("selected")) {
			$sort.trigger("reverse");
		} else {
			$("div.sort > div.selected").removeClass("selected");
			$(e.currentTarget).addClass("selected");
			$sort.trigger("sort");
		}
	});

	$sort.on("sort", function() {
		var sortFunc = {
			alphaAcid : function(hop) {
				return hop.alphaacid.max;
			},
			myrcene : function(hop) {
				return hop.myrcene.avg * hop.totaloilmls100gms.avg;
			},
			humulene : function(hop) {
				return hop.humulene.avg * hop.totaloilmls100gms.avg;
			},
			caryophyllene : function(hop) {
				return hop.caryophyllene.avg * hop.totaloilmls100gms.avg;
			},
			variety : function(hop) {
				return hop.variety;
			},
			origin : function(hop) {
				return hop.origin;
			}
		};
		var order = $("div.sort > div.selected").attr("id");
		hops = _.sortBy(hops, sortFunc[order]);
		draw(hops);
	});

	$sort.on("reverse", function() {
		hops = hops.reverse();
		draw(hops);
	});

	// Graph Drawing
	function yfmt() {
		var v = this.value;
		if (v <= 0)
			return -v + "%";
		return (v / 10) + "%";
	}

	function draw(hops) {
		var options = {
			title : false,
			legend : false,
			tooltip : false,
			credits : {
				enabled : false
			},
			chart : {
				type : 'bar'
			},
			xAxis : [ {
				categories : _.pluck(hops, 'variety'),
				reversed : false,
				labels : {
					step : 1
				}
			} ],
			yAxis : [ {
				title : false,
				labels : {
					formatter : yfmt
				},
				min : -20,
				max : 30
			}, {
				opposite : true,
				title : false,
				labels : {
					formatter : yfmt
				},
				min : -20,
				max : 30
			} ],

			plotOptions : {
				bar : {
					groupPadding : 0.01
				},
				series : {
					stacking : 'normal'
				}
			},

			colors : [ "#EBE9EA", "#D7D5DA", "#CAC7D2", "#DCE0E3", "#E8CD7C",
					"#CD8F78", "#CFD8AD" ]
		};
		options.series = [
				{
					name : 'AA High',
					data : _.chain(hops).map(function(hop) {
						return -hop.alphaacid.r;
					}).value()
				},
				{
					name : 'AA Low',
					data : _.chain(hops).map(function(hop) {
						var ach = hop['co-humuloneofaa'].avg;
						var aa = hop['alphaacid'].avg;
						return -(hop['alphaacid'].min - aa * (ach / 100));
					}).value()
				},
				{
					name : 'CH',
					data : _.chain(hops).map(function(hop) {
						var ach = hop['co-humuloneofaa'].avg;
						var aa = hop['alphaacid'].avg;
						return -aa * (ach / 100);
					}).value()
				},
				{
					name : 'Other',
					data : _.map(hops, function(hop) {
						var o = 100 - hop.caryophyllene.avg - hop.humulene.avg
								- hop.myrcene.avg;
						return (o / 100) * hop.totaloilmls100gms.avg * 10;
					})
				},
				{
					name : 'Caryophyllene',
					data : _.map(hops, function(hop) {
						return (hop.caryophyllene.avg / 100)
								* hop.totaloilmls100gms.avg * 10;
					})
				},
				{
					name : 'Humulene',
					data : _.map(hops, function(hop) {
						return (hop.humulene.avg / 100)
								* hop.totaloilmls100gms.avg * 10;
					})
				},
				{
					name : 'Myrcene',
					data : _.map(hops, function(hop) {
						return (hop.myrcene.avg / 100)
								* hop.totaloilmls100gms.avg * 10;
					})
				} ];
		if (!animate)
			options.plotOptions.bar.animation = false;
		$('#barchart').highcharts(options);
		animate = false;
	}

})();