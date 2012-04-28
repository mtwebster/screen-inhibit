const Applet = imports.ui.applet;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Util = imports.misc.util;
const PopupMenu = imports.ui.popupMenu;
const Calendar = imports.ui.calendar;
const UPowerGlib = imports.gi.UPowerGlib;
const PanelMenu = imports.ui.panelMenu;
const Main = imports.ui.main;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const Cinnamon = imports.gi.Cinnamon;


function MyApplet(orientation) {
    this._init(orientation);
}

MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(orientation) {        
        Applet.TextIconApplet.prototype._init.call(this, orientation);
        
        try {                 
           
            this.set_applet_icon_name("web-browser");
            this._orientation = orientation;
         

        }
        catch (e) {
            global.logError(e);
        }
    },
    
 
    

    
    on_applet_clicked: function(event) {
        this.menu.toggle();
        global.stage.set_key_focus(this.searchEntry);
    },
    

    on_orientation_changed: function (orientation) {
        this._orientation = orientation;
        this._initContextMenu();
    }


    
    
};

function main(metadata, orientation) {  
    let myApplet = new MyApplet(orientation);
    return myApplet;      
}
