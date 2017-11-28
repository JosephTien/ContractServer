using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Quobject.SocketIoClientDotNet.Client;
using Newtonsoft.Json;

public class ContList
{
    public string contListStr;
};

public class Cont
{
    public string usera;
    public string userb;
    public string title;
    public string contstr;
    public bool comfa;
    public bool comfb;
    public string signa;
    public string signb;
    public string time;
};

public class NewCont{
    public string usera;
    public string userb;
    public string title;
    public string contstr;
};

public class ContSign
{
    public string user;
    public string sign;
};

public class SocketIOScript : MonoBehaviour {
    public static string serverURL = "http://140.114.79.129:8080";
    //public static string serverURL = "https://contractserver.herokuapp.com";

    public static SocketIOScript instance;
    protected static Socket socket = null;
    static int[] contList = new int[0];
    static List<Cont> contQueue = new List<Cont>();
    static bool fetchLock = false;

    public static bool ContListReady()
    {
        return SocketIOScript.contList.Length > 0 && SocketIOScript.contQueue.Count == SocketIOScript.contList.Length;
    }

    public static void fetchCont(string uid)
    {
        if (fetchLock) return;
        fetchLock = true;
        contList = new int[0];
        contQueue = new List<Cont>();
        getContList(uid);
        instance.StartCoroutine(ifetchCont());
    }

    static IEnumerator ifetchCont() {
        while (contList.Length ==0) yield return new WaitForSeconds(0.1f);
        foreach (var i in contList) getCont(i + "");
        while (ContListReady()) yield return new WaitForSeconds(0.1f);
        fetchLock = false;
        print("Cont List Num : " + contList.Length);
    }

    static void DoOpen() {
		if (socket == null) {
			socket = IO.Socket (serverURL);
			socket.On (Socket.EVENT_CONNECT, () => {
                print("Connected...");
            });
			socket.On ("getContList", (data) => {
                string str = data.ToString();
                ContList contListObj = JsonConvert.DeserializeObject<ContList>(str);
                string[] strs = contListObj.contListStr.Split(',');
                List<int> contList_ = new List<int>();
                foreach (var s in strs) {
                    contList_.Add(int.Parse(s));
                }
                contList = contList_.ToArray();
            });
            socket.On("getCont", (data) => {
                string str = data.ToString();
                Cont contObj = JsonConvert.DeserializeObject<Cont>(str);
                contQueue.Add(contObj);
            });
        }
	}

	static void DoClose() {
		if (socket != null) {
			socket.Disconnect ();
			socket = null;
		}
	}

    public static void addCont(string usera, string userb, string title, string contstr)
    {
        if (socket != null)
        {
            NewCont cont = new NewCont();
            cont.usera = usera;
            cont.userb = userb;
            cont.title = title;
            cont.contstr = contstr;
            string json = JsonConvert.SerializeObject(cont);
            socket.Emit("addCont", json);
            print(json);
        }
    }

    public static void comfirm(string uid) {
		if (socket != null) {
            ContSign contSign = new ContSign();
            contSign.user = uid;
            contSign.sign = "";
            string json = JsonConvert.SerializeObject(contSign);
            socket.Emit ("comfirm", json);
        }
	}
    public static void signature(string uid, string sign)
    {
        if (socket != null)
        {
            ContSign contSign = new ContSign();
            contSign.user = uid;
            contSign.sign = "PowerBy_"+uid;
            string json = JsonConvert.SerializeObject(contSign);
            socket.Emit("signature", json);
        }
    }

    public static void getContList(string uid)
    {
        if (socket != null)
        {
            ContSign contSign = new ContSign();
            contSign.user = uid;
            contSign.sign = "";
            string json = JsonConvert.SerializeObject(contSign);
            socket.Emit("getContList", json);
        }
    }
    
    public static void getCont(string cid)
    {
        if (socket != null)
        {
            socket.Emit("getCont", "{\"cid\" : " + cid + "}");
        }
    }
    //*********************************************************************************
    // Use this for initialization
    void Start()
    {
        instance = this;
    }

    // Update is called once per frame
    void Update()
    {

    }

    void Destroy()
    {
        DoClose();
    }

    public void test()
    {
        DoOpen();
    }

    public void test1()
    {
        addCont("1234", "5678", "New Contract", "handsome");
    }

    public void test2()
    {
        fetchCont("1234");
    }
}
