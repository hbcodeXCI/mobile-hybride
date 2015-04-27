import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.AsyncTask;
import android.provider.MediaStore;
import android.util.Log;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;


import com.google.gson.Gson;

import org.json.JSONException;
import org.json.JSONObject;


/**
 * Created by harksin on 22/04/15.
 */
public class AsyncCacheBuilder extends AsyncTask {
    private Context myContext;
    private CacheDescriptor caDe;
    private DownloadManager dm;
    private CacheDescriptor caDeLocal;

    //constructeur
    public AsyncCacheBuilder(Context context, CacheDescriptor c,DownloadManager d)
    {

        this.myContext = context ;
        this.caDe=c;
        this.dm =d;
        this.caDeLocal=null;
    }





    // Méthode exécutée au début de l'execution de la tâche asynchrone
    @Override
    protected void onPreExecute() {
        super.onPreExecute();
    }




    //@Override
    protected void onProgressUpdate(Integer... values){
        super.onProgressUpdate(values);

//        // Mise à jour de la ProgressBar
//
//        this.mProgressBar.setProgress(values[0]);
    }






    @SuppressLint("NewApi")
    @Override
    protected Object doInBackground(Object... params) {

        Log.d("PluginRDE_RUN","asyncTask");


        Log.d("PluginRDE","descripteur de cache actif : "+this.caDe.toString());


        this.onProgressUpdate(0);

        /***
         *  Todo verification de l'existance du cache ds le .json du nom
         *  Todo Comparaison des emprise si existant
         *  Todo si Nouveau plus vaste alors rechargé la partie manquante
         *
         *
         */




//
//        try {
// open the file for reading
        InputStream instream = null;
        try {
            instream = new FileInputStream(myContext.getExternalFilesDir( "Tile").getPath()+"/"+this.caDe.getSource() +"_"+ this.caDe.getNom()+".json");


// if file the available for reading
            if (instream != null) {
                // prepare the file for reading
                InputStreamReader inputreader = new InputStreamReader(instream);
                BufferedReader buffreader = new BufferedReader(inputreader);

                String line="";

                // read every line of the file into the line-variable, on line at the time
                do {
                    line = line +" " +buffreader.readLine();
                    // do something with the line
                } while (line != null);

                Log.d("PluginRDE_Json","String in Json File : "+line);
                this.caDeLocal = new CacheDescriptor( new JSONObject(line));



                }

            instream.close();

        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (JSONException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
//        finally {
//
//                try {
//
//                } catch (IOException e) {
//                    e.printStackTrace();
//                }
//
//        }






        this.onProgressUpdate(20);


/***
 *TODO un repartiteur pour mutualisé la gestion des type
 */




        //chargement des tuiles si inexistant
        if(caDeLocal == null){

            if(this.caDe.getTypeSource().equals("TMS")){


//                ArrayList<Tile> aTile = this.caDe.firstLvlTileFromBb_TMS();


                this.aTileDownload( this.caDe.firstLvlTileFromBb_TMS());



            }
            //todo iplementer les autres type


        }
        //Cas d'une mise a jour :
        if(! (caDeLocal==null) && ! caDeLocal.equals(caDe)){

            /**
             * TODO comment on gere la fraicheur des donnée?
             */



            if(this.caDe.getTypeSource().equals("TMS")){

                this.aTileDownload( caDeLocal.getDiff(caDe)); //recupere les tuiles et leur sous tuile non encore presente

            }

        }




        //Ecriture des metaData Du cache
        if( caDeLocal == null ||  ! caDe.equals(caDeLocal))
        {

            /**
             * TODO ecriture du cache descriptor dans un fichier json.
             * Todo nomDeLaSource_NomDuCache.json
             *
             * TODO : NOTE : nom => source => id ??
             *
             */


            Gson gson = new Gson();

            // convert java object to JSON format,
            // and returned as JSON formatted string

            String json = gson.toJson(this.caDe);


            FileWriter file = null;
            try {
                File fi = new File(myContext.getExternalFilesDir( "Tile").getPath()+"/"+this.caDe.getSource() +"_"+ this.caDe.getNom()+".json");

                Log.d("PluginRDE_Json", myContext.getExternalFilesDir( "Tile").getPath()+"/"+this.caDe.getSource() +"_"+ this.caDe.getNom()+".json");

                file = new FileWriter(new File(myContext.getExternalFilesDir( "Tile").getPath()+"/"+this.caDe.getSource() +"_"+ this.caDe.getNom()+".json"));
                file.write(gson.toJson(this.caDe));
//            file.flush();
                file.close();

            } catch (IOException e) {
                e.printStackTrace();
            }


            Log.d("PluginRDE_Json",json);



        }


        this.onProgressUpdate(100);
        return null;

    }


    // Méthode exécutée à la fin de l'execution de la tâche asynchrone

    @Override
    protected void onPostExecute(Object result) {

        super.onPostExecute(result);

        //ToDo renvoyer un event pour informer l'ui de la disponibilité d'un cache


    }


    private void aTileDownload(ArrayList<Tile> aTile){
        if(aTile.get(0).getZ()<= caDe.getzMax())

        for(Tile t  :aTile){
            Log.d("PluginRDE_debug_DL", "tile en cours de DL : "+t.toString());

            this.launchTileDl(t);

            //recur : sur la sous tuile
            if(t.getZ()< caDe.getzMax()) {
                aTileDownload(t.subServientTile_TMS());
            }
        }

    }



    public long launchTileDl(Tile t) {


        //TODO methode get url dans tile @param type


        Log.d("PluginRDE", "downloadTile");

//        DownloadManager.Request request = new DownloadManager.Request( Uri.parse(this.caDe.getUrlSource() + "/" + t.getZ() + "/" + t.getX() + "/" + t.getY() + ".png"));
        DownloadManager.Request request = new DownloadManager.Request( Uri.parse(this.caDe.getUrlSource() +"/"+t.getTMSsampleReq()));
        Log.d("PluginRDE","http://a.tile.openstreetmap.org" + "/" + t.getZ() + "/" + t.getX() + "/" + t.getY() + ".png");

        //Restrict the types of networks over which this download may proceed.
        request.setAllowedNetworkTypes(DownloadManager.Request.NETWORK_WIFI | DownloadManager.Request.NETWORK_MOBILE);
        //Set whether this download may proceed over a roaming connection.
//        request.setAllowedOverRoaming(false);

        request.setDescription("MiseAJourDuCache");


        request.setDestinationInExternalFilesDir(myContext, this.caDe.getDirPath() + t.getZ() + "/" + t.getX()+"/" , t.getY()+".png");

        return dm.enqueue(request);

    }
}