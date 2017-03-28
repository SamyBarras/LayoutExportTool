// SHOT OBJECT 
    function shotObj_template ()
        {
            this.entityType = 'Shot';
            this.name = undefined;
            this.project = "The Amazing World Of Gumball";
            this.episodeCode = "%1_%2";
            this.shotCode="%1_%2";
            this.background_asset=undefined;
            this.task_template = undefined;
            this.maFile = undefined;
            this.status = "not exported";
            this.exportAE = true;
            this.exportQT = true;
            this.exportFraming = true;
        }
    
//* BACKGROUND ASSET OBJECTS *//
    function new_BGAssetObj (shotObject)
        {    
            this.entityType = 'Asset';
            this.project = "The Amazing World Of Gumball";
            this.episode = shotObject.episodeCode;
            this.parentShot = [shotObject.name];
            this.name = undefined;
            this.type = "Background";
            this.BGType =  undefined;
            this.task_template = undefined;
            this.tag_list = undefined;
            this.files = undefined;
            this.previewFile = undefined;
            this.resolution = undefined;
            this.creator = system.userName;
            this.status = "not exported";
            this.sg_id = undefined;
            this.id = undefined;
        }
    
    function reuse_BGAssetObj (id,name)
        {
            this.entityType = 'Asset';
            this.project = "The Amazing World Of Gumball";
            this.BGType = 're-use';
            this.sg_id = id;
            this.status = 're-use';
            this.name = name;
            this.id = 're-use';
        }