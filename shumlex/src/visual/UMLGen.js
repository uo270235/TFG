const uniqid = require("uniqid");
const IRIManager = require("../../src/managers/IRIManager.js");
const xmiparser = require('../../src/xmi_util/XMIParser.js');
const ShExCardinality = require("../../src/shex_util/shexgen/ShExCardinality.js");
const ShapeManager = require("../managers/ShapeManager.js");
let XMISources = {0: "VisualParadigm", 1: "Modelio"};
let XMISource = XMISources[0];

const mermaid = require('../../lib/mermaid/mermaid.min.js');
const $ = require('jquery');

class UMLGen {

    constructor() {
        this.irim = new IRIManager();
        this.shm = new ShapeManager(uniqid);

        this.classes = new Map();
        this.types = new Map();
        this.enums = new Map();
        this.constraints = new Map();
		
		this.noSymbolNames = new Map(); 
										
		this.relationships = new Map();
		this.terms = [];
		this.rpTerms = new Map();	//Termino repetido y el ID que lo unifica
		this.rpNumber = 0;
		this.blankCount = 1;
    }
	
	crearSVG(id, umlcr, ops) {
		
		let maxheight = ops.max_height ? ops.max_height : "500px";
		let maxwidth = ops.max_width ? ops.max_width : "100vw";
		$("#output").text(umlcr);
		$("#" + id).css("max-height", maxheight);
		$("#" + id).css("max-width", maxwidth);
		$("#" + id).text(umlcr);
		mermaid.init({flowchart: { useMaxWidth: false }}, "#" + id);

		$("#" + id).removeAttr("data-processed");
		
		let self = this;
		//Borrar caracteres empleados para la generación
		$( "#" + id + " .nodeLabel" ).each(function( index ) {
			
			let contenido = $(this).text().replace(/\\/g, "")
									.replace(/\"/g, "")
									.replace(/\*(<|>)/g, "~")
									.replace(/-\/\//g, "{")
									.replace(/\/\/-/g, "}")
									.replace(/CLOSED/g, " CLOSED")
									.replace(/_?:?<?[^prefix][A-Za-z0-9_]+>? : /g, "");
									
			if(contenido.match(/_Blank[0-9]+/)) contenido = "";
									
			$(this).text(contenido);
			
			let elements = contenido.split(" ");
			for(let i = 0; i < elements.length; i++) {
				let originalName = self.noSymbolNames.get(elements[i]);	
				if(originalName) {
					let newText = $(this).text().replace(elements[i], originalName);
					$(this).text(newText);
				}
			}		
			
		});

		//ID adecuado
		$( "#" + id + " .classTitle .nodeLabel" ).each(function( index ) {
			
			let id = $(this).text();
			if(id === "") id = "_Blank" + self.blankCount++;
									
			$(this).parent().parent().parent().parent().attr("id", id);
							
		});

		let edgeID = 1;
		
		 
		$( "#" + id + " span span.edgeLabel" ).each(function( index ) {
			let contenido = $(this).text();
			let originalName = self.noSymbolNames.get(contenido);
			if(originalName) {
				$(this).text($(this).text().replace(contenido, originalName));
			}

			let repeatedId = self.rpTerms.get(contenido);
			let id = $(this).text();
			if(repeatedId) {
				id = repeatedId;
			}

			let lroot = $(this).parent().parent().parent().parent().parent();

			lroot.attr("id", id + "-label");
			$("#id" + edgeID).attr("id", id + "-edge");
			edgeID++;
			if(lroot.next() 
				&& lroot.next().attr("class") === "edgeTerminals") {
				lroot.next().attr("id", id + "-card");
			}
		});
		
		$( "#" + id + " div span.edgeLabel" ).each(function( index ) {
			let contenido = $(this).text();
			$(this).text(contenido.replace(/-\/\//g, "{")
								  .replace(/\/\/-/g, "}")
								  .replace(/_hash_/g, "#"));
		});
		
		
		//Añadir <> a los que carezcan de prefijo
		$( "#" + id + " .title" ).each(function( index ) {
			let contenido = $(this).text();
			if(!(contenido === "Prefixes" || contenido.includes(":") || contenido.includes("<") || contenido.includes("_Blank")))
				$(this).text("<" + contenido + ">");	
			$(this).parent().parent().attr("id", $(this).text()); //El nombre de la clase como ID del elemento
		});
		
		$("#" + id + " svg").removeAttr("width");
		
		$(".edgeTerminals span").attr("font-size", "12");	
		
	}
	
	asignarEventos(id) {
		let self = this;
				// Evento de ocultar todos los elementos y mostrar las relaciones vinculadas a un ID
		function resaltar(event) {
			
			let element = $( "#" + $.escapeSelector(event.data.idB) );
			
			if(!element.hasClass("highlighted")) {
				
				if($(".highlighted").length === 0) {
					//Ocultar todo
					$( "#" + id + " .node" ).each(function( index ) {
						$(this).css("opacity", "0.1");
					});

					$( "#" + id + " g.edgeLabel" ).each(function( index ) {
						$(this).css("opacity", "0.1");
					});

					$( "#" + id + " .edgeTerminals" ).each(function( index ) {
						$(this).css("opacity", "0.1");
					});
					
					$( "#" + id + " .edgePaths > path" ).each(function( index ) {
						$(this).css("opacity", "0.1");
					});
				}
				
				element.css("opacity", "1"); //Él mismo
				element.addClass("highlighted");  //Lo marcamos
				
				//A cada una de las relaciones les quitamos la opacidad
				let resaltados = $(".highlighted");
				//Para cada uno de los resaltados, mostrar sus relaciones
				for(let j = 0; j < resaltados.length; j++) {
					let idResaltado = resaltados[j].id;
					$("#" + $.escapeSelector(idResaltado)).css("opacity", "1");
					
					let relationships = self.relationships.get(idResaltado);
					if(!relationships) {
						continue;
					}
					for(let i = 0; i < relationships.length; i++) {
						$( "#" + $.escapeSelector(relationships[i]) ).css("opacity", "1");
						$( "#" + $.escapeSelector(relationships[i]) ).addClass("highlightOf-" + idResaltado);
						$( "#" + $.escapeSelector(relationships[i]) + "-label" ).css("opacity", "1");
						$( "#" + $.escapeSelector(relationships[i]) + "-edge" ).css("opacity", "1");
						$( "#" + $.escapeSelector(relationships[i]) + "-card" ).css("opacity", "1");
						let lv2relationships = self.relationships.get(relationships[i]);
						if(!lv2relationships) {
							continue;
						}
						for(let j = 0; j < lv2relationships.length; j++) {
							if(lv2relationships[j].match(/AND[0-9]*/) || lv2relationships[j].match(/OR[0-9]*/) || lv2relationships[j].match(/OneOf[0-9]*/)) {
								$( "#" + $.escapeSelector(lv2relationships[j]) + "-label" ).css("opacity", "1");
								$( "#" + $.escapeSelector(lv2relationships[j]) + "-edge" ).css("opacity", "1");
							}
						}
					}
				}
			}
			else {
				element.removeClass("highlighted");
				if($(".highlighted").length === 0) {	//Si no quedan elementos resaltados regresamos al estado primigenio
					$( "#" + id + " g" ).each(function( index ) {
						$(this).css("opacity", "1");
					});
					
					$( "#" + id + " path" ).each(function( index ) {
						$(this).css("opacity", "1");
					});
				}
				else {	//Si no, únicamente los tapamos de nuevo
					if(!$(this).is('[class*="highlightOf"]')) {	//Si no está ya resaltado por otra clase
						element.css("opacity", "0.1"); 
					}
					let relationships = self.relationships.get(event.data.idB);
					if(!relationships) {
						return;
					}
					for(let i = 0; i < relationships.length; i++) {
						$( "#" + $.escapeSelector(relationships[i]) ).removeClass("highlightOf-" + event.data.idB);
						if(!$( "#" + $.escapeSelector(relationships[i])).hasClass("highlighted")
								&& !$( "#" + $.escapeSelector(relationships[i])).is('[class*="highlightOf"]')) {
							$( "#" + $.escapeSelector(relationships[i]) ).css("opacity", "0.1");
						}
						$( "#" + $.escapeSelector(relationships[i]) + "-label" ).css("opacity", "0.1");
						$( "#" + $.escapeSelector(relationships[i]) + "-edge" ).css("opacity", "0.1");
						$( "#" + $.escapeSelector(relationships[i]) + "-card" ).css("opacity", "0.1");
					}
				}
				
			}
			
		}
		
		// Vincular a cada clase el evento de mostrar las relaciones
		$( "#" + id + " .node" ).each(function( index ) {
			$(this).css("cursor", "pointer");
			let idBase = $(this).attr("id");
			$(this).click({idB: idBase}, resaltar);
		});
		
		// Vincular el evento de mostrar el tooltip
		let checkEntity = async function (entity,endPoint){
			return $.get(
			  {
			
				url: endPoint+'api.php?action=wbgetentities&format=json&ids='+ entity,
				dataType: 'jsonp',
			
			  })
			   
		}

		let loadTooltip = function(data,wikiElement,posX,posY){
			if(!data.error){
		  
				var userLang;
				var entity = '';
				var description=''
				var theme;
				//Gets the preference language from the navigator
				userLang = (navigator.language || navigator.userLanguage).split("-")[0]
		  
		  
				var content = data.entities[wikiElement.toUpperCase()]
		  
				//Check if the property/entity exist
				if(!content.labels)return;
		  
				//Some properties and entities are only avalible in English
				//So if they do not exist we take it in English
				if(content.labels[userLang] && content.descriptions[userLang]){
				   
					entity = content.labels[userLang].value +' ('+wikiElement+')'
					description = content.descriptions[userLang].value
		  
				}else{
		  
					let lb = content.labels['en'];
					let desc = content.descriptions['en'];
					if(lb){
					  entity = lb.value +' ('+wikiElement+')';
					}
					if(desc){
					   description = desc.value
					}
					
				}

				const themeStyles ={
					default:{
					  'display': 'inline-block',
					  'justify-content': 'center',
					  'padding': '10px',
					  'border-radius': '8px',
					  'border': '1px solid #B8F5F3',
					  'background':'white',
					  'color':'#222',
					  'z-index':'1200'
					},
					dark:{
					  'display': 'inline-block',
					  'justify-content': 'center',
					  'padding': '5px',
					  'border-radius': '10px',
					  'border': '1px solid #70dbe9',
					  'background':'#222',
					  'color':'white',
					  'z-index':'1200'
					}
				  }

				  const styles ={
					title:{
					  'text-align': 'left',
					  'font-size':17,
					  'font-family': 'Arial, Helvetica, sans-serif'
					},
					description:{
					  'display': 'inline-block',
					  'line-height': '23px',
					  'text-align': 'left',
					  'margin-top': '3px',
					  'font-size':14,
					  'font-family': 'Arial, Helvetica, sans-serif'
					}   
				  }
		  
				let cssStyle = themeStyles['default'];
		  
				//Jquery in 2021 ahora mejor todavía
				$('<div class="CodeMirror cm-s-default CodeMirror-wrap">')
					.css( 'position', 'absolute' )
					.css( 'z-index', '1200' )
					.css( 'max-width', '200px' ).css( { 
					top: posY + 2,
					left: posX + 2
					} )
				  .addClass('wikidataTooltip').css('height','auto')
				  .append(
					$('<div class="wikidata_tooltip">').css(cssStyle)
					.append(
					  $('<div>').html(entity).css(styles.title))
					.append(
					  $('<div>').html(description).css(styles.description)))
				  .appendTo('body').fadeIn( 'slow' );
			  }
		  }

		let mouseOvers = new Map();
		let mouseActive = -1;
		let mouseOverId = 0;

		$( "#" + id + " span span.edgeLabel" ).each(function() {

			let targetId = mouseOverId;
			mouseOverId++;

			$(this).on( "mouseover", async function(e) {		
				let label = e.target.innerText;
				mouseOvers.set(targetId, true);

				let posX = e.clientX,
  					posY = e.clientY + $( window ).scrollTop();

				let prefixName = label.split(':')[0];
				let wikiElement = label.split(':')[1];

				if(wikiElement!== undefined  && wikiElement!== ''){
					let endpoint = "https://www.wikidata.org/w/"
					let data = await checkEntity(wikiElement,endpoint)
					if(mouseOvers.get(targetId) && mouseActive != targetId) {
						loadTooltip(data,wikiElement,posX,posY);
						mouseActive = targetId;
					}			
				  }
			});

			$(this).on( "mouseleave", function(e) {
				$(".wikidataTooltip").remove();
				mouseOvers.set(targetId, false);
				mouseActive = -1;
			});
		});

		$( "#" + id + " .nodeLabel" ).each(function() {

			let targetId = mouseOverId;
			mouseOverId++;

			$(this).on( "mouseover", async function(e) {
				mouseOvers.set(targetId, true);
				let label = e.target.innerText;

				let posX = e.clientX,
  					posY = e.clientY + $( window ).scrollTop();

				let members = label.split(" ");

				for(let i = 0; i < members.length; i++) {
					let prefixName = members[i].split(':')[0];
					let wikiElement = members[i].split(':')[1];		
	
					if(wikiElement!== undefined  && wikiElement!== ''){
						let endpoint = "https://www.wikidata.org/w/"
						let data = await checkEntity(wikiElement,endpoint);
						if(mouseOvers.get(targetId) && mouseActive != targetId) {
							loadTooltip(data,wikiElement,(posX + i*205),posY);
							if(i === members.length - 1) {
								mouseActive = targetId;
							}			
						}
					}
				}
		
			});

			$(this).on( "mouseleave", function(e) {
				$(".wikidataTooltip").remove();
				mouseOvers.set(targetId, false);
				mouseActive = -1;
			});
		});
	}

    /**
     * Genera el código Mermaid
     * @param xmi   XMI fuente
     * @returns {string}    En formato MUML
     */
    generarCodigoMUML(xmi) {
		this.clear();
        let muml = "classDiagram\n";
        muml += this.parseXMIToMUML(xmi);
        return muml;
    }

    /**
     * Parsea el valor XMI a código MUML
     * @param xmi   XMI a parsear
     * @returns {string}
     */
    parseXMIToMUML(xmi) {
        let mumlEquivalent = "";
		let mumlEnums = "";

        let source = xmiparser.parseXMI(xmi);

        let ownedRules;
        //Generado por Modelio
        if(source["uml:Model"]) {
            XMISource = XMISources[1];
            ownedRules = source["uml:Model"]["ownedRule"];
        }
        //Generado por VisualParadigm
        else if(source["xmi:XMI"]) {
            XMISource = XMISources[0];
            ownedRules = source["xmi:XMI"]["uml:Model"][0]["ownedRule"];
        }


        //Guardar en constraints las restricciones
        if(ownedRules !== undefined) {
            for (let i = 0; i < ownedRules.length; i++) {
                let idInComment = null;
                let consElement = ownedRules[i].$.constrainedElement;
                let oName = ownedRules[i].$.name.replace(/{/g, "-//").replace(/}/g, "//-");
                //Si hay comentario, buscamos el ID que guardamos
                if(ownedRules[i].ownedComment) {
                    idInComment = ownedRules[i].ownedComment[0].body[0];
                }
                //Si el id guardado en comentario es distinto del que se señala en constrained,
                //Es un error de exportación. Tomamos el del comentario.
                if(idInComment && idInComment !== consElement) {
                    consElement = idInComment;
                }
                if(this.constraints.get(consElement) === undefined) {
                    this.constraints.set(consElement, oName);
                }
                else {
                    this.constraints.set(consElement, this.constraints.get(consElement) + " "
                        + oName);
                }
            }
        }

        let packagedElements = [];

        if(XMISource === XMISources[0]) {
            packagedElements = source["xmi:XMI"]["uml:Model"][0]["packagedElement"];
        } else {
            packagedElements = source["uml:Model"]["packagedElement"];
        }

        try {

            for (let i = 0; i < packagedElements.length; i++) {
                let pe = packagedElements[i];
                let type = pe["$"]["xmi:type"];
                if (type === "uml:Class") {
                    this.shm.saveShape(pe);
                }
            }

            //Revisar cada PackagedElement
            for (let i = 0; i < packagedElements.length; i++) {
                let pe = packagedElements[i]["$"];
                let type = pe["xmi:type"];
                let name = pe.name;
                let id = pe["xmi:id"];
                //Guardamos las clases para futuras referencias
                if (type === "uml:Class") {
                    let cn = this.constraints.get(id);
					if(cn && cn.charAt(0) === '/') {
						cn = undefined;
					}
                    name = name + (cn === undefined ? "" : " " + cn) ;
                    this.classes.set(id, name);
                }
                //Guardamos los tipos
                else if (type === "uml:PrimitiveType") {
                    this.types.set(id, name);
                }
                //Guardamos los prefijos
                else if (type === "uml:Enumeration" &&
                    name === "Prefixes") {
                    this.enums.set(id, name);
                    //Generamos la enumeración que contiene los prefijos
                    mumlEquivalent += "class " + name + " {\n<<enumeration>>\n";
                    for (let j = 0; j < packagedElements[i].ownedLiteral.length; j++) {
						let prefix = packagedElements[i].ownedLiteral[j].$.name;
						let fragments = prefix.split(" ");
						if(fragments[0] === "prefix") {
							prefix = `${fragments[0]} \\${fragments[1]} ${fragments[2]}`;
						}
                        mumlEquivalent +=  prefix + "\n";
                    }
                    mumlEquivalent += "}\n";

                }
                //Generamos las enumeraciones corrientes
                else if (type === "uml:Enumeration") {
					this.enums.set(id, name);
					let sanitizedName = this.adaptPref(name);
					this.noSymbolNames.set(sanitizedName, name);
					mumlEnums += "class " + sanitizedName + " {\n<<enumeration>>\n";
					for (let j = 0; j < packagedElements[i].ownedLiteral.length; j++) {
						mumlEnums += packagedElements[i].ownedLiteral[j].$.name.replace(/~/g, "*~") + "\n";
					}
					mumlEnums += "}\n";                   
                }
            }

            //Generamos las clases y su contenido
            for (let i = 0; i < packagedElements.length; i++) {
                if (packagedElements[i]["$"]["xmi:type"] === "uml:Class") {
                    mumlEquivalent += this.createUMLClass(packagedElements[i])
                }
            }

			mumlEquivalent += mumlEnums;

        } catch (ex) {
            console.log("Se ha producido un error durante la generación de UML.\n" +
                "El XMI está bien formado, pero faltan elementos o atributos clave para la generación.\n"
                + ex);
            return "";
        }
		
		function removeClosed(str, p1, p2, offset, s)
		{
			return str.replace("CLOSED ", "");
		}
		
		mumlEquivalent = mumlEquivalent
							.replace(/[\r\n]+(_)?[A-Za-z0-9_]+(_)? CLOSED :/g, removeClosed);

		console.log(mumlEquivalent);
        return mumlEquivalent;
    }
	
	base64SVG(idsvg) {
		let bs = btoa($("#" + idsvg).html());
		return `data:image/svg+xml;base64,${bs}`;
	}

    /**
     * Crea una clase en PUML
     * @param element   Clase
     * @returns {string}
     */
    createUMLClass(element) {
        //Extraemos las restricciones y se las asignamos al nombre, si existen
        let cn = this.constraints.get(element.$["xmi:id"]);
		let sanitizedName = this.adaptPref(element.$.name);
		this.noSymbolNames.set(sanitizedName, element.$.name);
		let attributes = element.ownedAttribute;
        if(!attributes) {
            attributes = [];
        }
		if(cn && cn.charAt(0) === '/') {
			attributes.push({"$": {"name": ":pattern", "type": "any", "xmi:id": element.$["xmi:id"]}});
			cn = undefined;
		}
        let name = sanitizedName + (cn === undefined ? "" : " " + cn);
        let clase = "class " + name + " {\n";

        

        //Generamos los atributos de la clase
        let ats = this.createUMLAttributes(attributes, name);
		ats.ins.forEach(el => clase += el);
		clase += "}\n";
		if(ats.ins.length === 0) {
			clase = "class " + name + "\n";
		}
		ats.out.forEach(el => clase += el);
		
		//Relaciones de herencia
        if(element.generalization) {
            for(let i = 0; i < element.generalization.length; i++) {
				let relName = element.generalization[i].$.name;
                let hename = relName ? (" : " + relName) : "";
				let gname = this.classes.get(element.generalization[i].$.general);
				let gsanitizedName = this.adaptPref(gname);
				this.noSymbolNames.set(gsanitizedName, gname);
                
				let orName = this.noSymbolNames.get(name);
				if(!this.relationships.get(orName)) {
					this.relationships.set(orName, []);
				}
				let rList = this.relationships.get(orName);
				rList.push(gname);
				this.saveTerm(orName);
				this.saveTerm(gname);
				let unique = this.saveTerm(relName);
				//Procurar que no se repitan nombres de relaciones para hacer el mapeado de relaciones
				if(!unique) {
					rList = this.relationships.get(orName);
					let relNameRP = relName + this.rpNumber;
					rList.push(relNameRP);
					this.relationships.set(orName, rList);
					this.rpTerms.set(relNameRP, relNameRP);
					this.rpNumber++;
					hename = " : " + relNameRP;
					this.noSymbolNames.set(relNameRP, relName);
				}
				else {
					rList.push(relName);
					this.relationships.set(orName, rList);
				}
				clase += gsanitizedName + " <|-- " + name
                    + hename + "\n";
            }
        }
        return clase;
    }

    /**
     * Crea los atributos de una clase en PUML
     * @param ats   Atributos
     * @param name  Nombre de la clase
     * @returns {string}    Listado de atributos
     */
    createUMLAttributes(ats, name) {
		let insideElements = [];
		let outsideElements = [];
        for(let i = 0; i < ats.length; i++) {
            let shape = this.shm.getShape(ats[i].$.type);
            let subSet = this.shm.getSubSet(ats[i].$.type);
            //Asociación entre clases
            if(ats[i].$.association                                 //Modelio ver.
                || shape !== undefined || subSet !== undefined) {   //VP ver.
                outsideElements.push(this.createUMLAsoc(ats[i], name));
            }
            //Restricción de tipo de nodo
            else if(ats[i].$.name.toLowerCase() === "nodekind") {
                let kind = this.types.get(ats[i].$.type);
                insideElements.push("nodeKind: " + kind + " \n");
            }
            //Atributo común
            else {
                insideElements.push(this.createUMLBasicAt(ats[i], name));
            }
        }
        return { out: outsideElements, ins: insideElements};
    }

    /**
     * Crea una asociación en PUML
     * @param at    Atributo
     * @param name  Nombre de la clase
     * @returns {string}    Asociación en PUML
     */
    createUMLAsoc(at, name) {

        //Obtenemos la cardinalidad de la asociación
        let card = ShExCardinality.cardinalityOf(at);
        let ccard = card === "" ? "" : "\"" + card + "\"";

        let relation = " --> ";
        if(at.$.aggregation === "composite") {
            relation = " *-- ";
        }
		if(at.$.name === "OR" || at.$.name === "OneOf" || at.$.name === "AND") {
			relation = " .. ";
		}

        //at.$.type indica el nombre de la clase
        //at.$.name indica el nombre de la relación
		let tyName = this.classes.get(at.$.type);
		let relName = at.$.name;
		let tysanitizedName = this.adaptPref(tyName);
		this.noSymbolNames.set(tysanitizedName, tyName);
		let relsanitizedName = this.adaptPref(relName);
		this.noSymbolNames.set(relsanitizedName, relName);
		//Guardar las relaciones
		let orName = this.noSymbolNames.get(name);
		if(!this.relationships.get(orName)) {
			this.relationships.set(orName, []);
		}
		let rList = this.relationships.get(orName);
		rList.push(tyName);
		this.saveTerm(tyName);
		let unique = this.saveTerm(relName);
		//Procurar que no se repitan nombres de relaciones para hacer el mapeado de relaciones
		if(!unique) {
			relsanitizedName = relsanitizedName + this.rpNumber;
			this.noSymbolNames.set(relsanitizedName, relName);
			relName = relName + this.rpNumber;	
			rList.push(relName);
			this.relationships.set(orName, rList);
			this.rpTerms.set(relsanitizedName, relName);
			this.rpNumber++;
		}
		else {
			rList.push(relName);
			this.relationships.set(orName, rList);
		}
        return name + relation + ccard.replace(/{/g, "-//").replace(/}/g, "//-") + " "
            + tysanitizedName + " : " + relsanitizedName + "\n";
    }

    /**
     * Crea un atributo básico en UML
     * Formato <clase> : <atributo>
     * @param at    Atributo
     * @param name  Nombre
     * @returns {string}    Atributo en PUML
     */
    createUMLBasicAt(at, name) {
        let card = ShExCardinality.cardinalityOf(at);
        let cn = this.constraints.get(at.$["xmi:id"]);
		if (cn !== undefined) {
			cn = cn.split(" ").join(" \\");
		}

		let tyName = this.getType(at);
		let atName = at.$.name;
		let tysanitizedName = this.adaptPref(tyName);
		this.noSymbolNames.set(tysanitizedName, tyName);
		let atsanitizedName = this.adaptPref(atName);
		this.noSymbolNames.set(atsanitizedName, atName);
        return atsanitizedName + " \"" + tysanitizedName + "\\" + card.replace(/{/g, "-//").replace(/}/g, "//-")
            + (cn === undefined ? "" : " \\" +  cn) + "\" \n";
    }

    /**
     * Extrae el tipo de un atributo
     * @param attr  Atributo
     * @returns {*} Tipo
     */
    getType(attr) {
        if(attr.type) {
            let href = attr.type[0].$.href.split("#");
            //Tipo XSD
            if(href[0] === "pathmap://UML_LIBRARIES/UMLPrimitiveTypes.library.uml") {
                return this.irim.findXSDPrefix() + href[1].substring(0,1).toLowerCase() + href[1].substring(1);
            }
            //Otro
            else {
                return href.pop();
            }
        }
        else if (attr.$.type) {
            if(attr.$.type === "Int_id") {
                return this.irim.findXSDPrefix() + "int";
            }
            let enumer = this.enums.get(attr.$.type);
            //Tipo enumeración
            if(enumer) {
                return enumer;
            }
			let type = this.types.get(attr.$.type);
			if(type) {
				return type;
			}
        }
        return ".";
    }
	
	adaptPref(prefix) {
		return prefix.replace(/[\:<>\^\-\/\.]/g, "_").replace(/#/g, "_hash_");
	}
	
	saveTerm(term) {
		for (let i = 0; i < this.terms.length; i++) {
			if(this.terms[i] === term) {
				return false;
			}
		}
		this.terms.push(term);
		return true;
	}
	
	clear() {
		this.classes = new Map();
        this.types = new Map();
        this.enums = new Map();
        this.constraints = new Map();
		
		this.noSymbolNames = new Map(); 
										
		this.relationships = new Map();
		this.terms = [];
		this.rpTerms = new Map();	//Termino repetido y el ID que lo unifica
		this.rpNumber = 0;
	}	

}
module.exports = UMLGen;