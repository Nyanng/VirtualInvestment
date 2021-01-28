using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mime;
using System.Net.Sockets;
using System.Reflection.Metadata;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using Fleck;

namespace WebServer
{
    class Program
    {
        static Dictionary<string, UserObject> UserList = new Dictionary<string, UserObject>();
        static List<Stock> StockList = new List<Stock>();
        static bool Running = false;
        static string StocksPrice = string.Empty;

        static void Main(string[] args)
        {
            var webSocket = new WebSocketServer("ws://0.0.0.0:30709");

            webSocket.Start(
                Sock =>
                {
                    //Sock.OnOpen = () => Logger.Write("Anonymous Socket Connected");
                    Sock.OnClose = () =>
                    {
                        UserList.ToList().ForEach((each) =>
                        {
                            if (each.Value.Socket == Sock)
                            {
                                each.Value.Socket.Close();
                                each.Value.Socket = null;
                            }
                        });
                    };

                    Sock.OnMessage = (Message) =>
                    {
                        string[] SplitText = Message.Split('|');
                        string User = SplitText[1];

                        switch (SplitText[0])
                        {
                            case "MyNameIs":
                                if (UserList.ContainsKey(SplitText[1]))
                                {
                                    if (UserList[User].Socket == null)
                                    {
                                        UserList[User].Socket = Sock;
                                        Logger.Write("[{0}] Connected", User);
                                    }
                                    else if (UserList[User].Socket.IsAvailable)
                                    {
                                        Logger.Write("[Server] Already Connected in Server");
                                        Sock.Send("AlreadyConnected");
                                        return;
                                    }
                                }
                                else
                                {
                                    UserList.Add(User, new UserObject(User, 10000000, Sock));
                                    Logger.Write("[Server] new User => {0}", User);
                                    Logger.Write("[{0}] Connected", User);
                                }

                                if (Running)
                                {
                                    Sock.Send("GameStart");

                                    string Stocks = string.Empty;

                                    StockList.ForEach(Stock =>
                                    {
                                        Stocks += $"|{Stock.Name}|{Stock.Price}";
                                    });

                                    Sock.Send($"HelloClient|{UserList[User].Point}{Stocks}");

                                    Stocks = string.Empty;

                                    UserList[User].Stock.ToList().ForEach(
                                        Each =>
                                        {
                                            Stocks += $"|{Each.Key}|{Each.Value}";
                                        }
                                    );

                                    Sock.Send($"MyStocks{Stocks}");
                                }
                                else
                                {
                                    Sock.Send("Wait");
                                }
                                break;

                            case "Buy":
                                try
                                {
                                    StockList.ForEach((Each) =>
                                    {
                                        if (Each.Name == SplitText[2] &&
                                            Each.Price * int.Parse(SplitText[3]) <= UserList[User].Point)
                                        {
                                            UserList[User].BuyStock(Each.Name, Each.Price, int.Parse(SplitText[3]));

                                            Sock.Send($"BuySuccess|{UserList[User].Point}|{Each.Name}|{UserList[User].Stock[Each.Name]}");

                                            Logger.Write($"[{UserList[User].Name}] Buy {Each.Name} {Each.Price}원 {SplitText[3]}개");
                                            return;
                                        }
                                    });
                                }
                                catch (Exception ex)
                                {
                                    Logger.Write("[Exception_Buy]", ex.Message);
                                }
                                break;

                            case "Sell":
                                try
                                {
                                    StockList.ForEach((Each) =>
                                    {
                                        if (Each.Name == SplitText[2] &&
                                            UserList[User].Stock.ContainsKey(SplitText[2]) &&
                                            UserList[User].Stock[SplitText[2]] >= int.Parse(SplitText[3]))
                                        {
                                            UserList[User].SellStock(Each.Name, Each.Price, int.Parse(SplitText[3]));

                                            Sock.Send($"SellSuccess|{UserList[User].Point}|{Each.Name}|{UserList[User].Stock[Each.Name]}");

                                            Logger.Write($"[{UserList[User].Name}] Sell {Each.Name} {Each.Price}원 {SplitText[3]}개");
                                            return;
                                        }
                                    });
                                }
                                catch (Exception ex)
                                {
                                    Logger.Write("[Exception_Sell]", ex.Message);
                                }
                                break;

                            case "GetPrice":
                                UserList[User].GetPrice = true;
                                break;

                            case "Prev":
                                //Logger.Write(StockList[int.Parse(SplitText[2])].StockLog.ToString());
                                UserList[User].Socket.Send("PrevPrice|" + StockList[int.Parse(SplitText[2])].StockLog.ToString());
                                break;

                            default:

                                break;
                        }

                    };
                }
            );

        Cmd:
            var StrArg = Console.ReadLine();
            var Cmd = StrArg.Split();

            switch (Cmd[0].ToLower())
            {
                case "delisting":
                    if (StockList.Count < int.Parse(Cmd[1]))
                    {
                        Logger.Write("[Server] Stock Not Found");
                        goto Cmd;
                    }

                    if (StockList[int.Parse(Cmd[1])].Delisting)
                        Logger.Write("[Server] Already Delisting");
                    else
                    {
                        StockList[int.Parse(Cmd[1])].Delisting = true;
                        StockList[int.Parse(Cmd[1])].Price = 0;
                    }
                    goto Cmd;

                case "clearsocket":
                    string UserName = StrArg.Replace("clearsocket ", "");
                    if (UserList.ContainsKey(UserName))
                    {
                        UserList[UserName].Socket.Close();
                        UserList[UserName].Socket = null;
                    }
                    else
                        Logger.Write("[Server] User Not Found");
                    goto Cmd;

                case "start":
                    if (!Running)
                    {
                        Logger.Write("[==========시작==========]");

                        foreach (var Name in Const.StockNames)
                        {
                            var Stk = new Stock(Name, Utils.Price(), (int)Utils.GetValue(8, 11));
                            StockList.Add(Stk);
                            Logger.Write("[Server] Create Stock:" + Name);
                        }

                        UserList.ToList().ForEach(
                            Each =>
                            {
                                string Stocks = string.Empty;

                                StockList.ForEach(Stock =>
                                {
                                    Stocks += $"|{Stock.Name}|{Stock.Price}";
                                });

                                if (Each.Value.Socket != null)
                                {
                                    Each.Value.Socket.Send("GameStart");
                                    Each.Value.Socket.Send($"HelloClient|{Each.Value.Point}{Stocks}");
                                }
                            }
                        );

                        Running = true;
                        new Thread(() =>
                        {
                            doThread();
                        })
                        {
                            IsBackground = true
                        }.Start();
                    }
                    else
                        Logger.Write("[Server] Already Started");

                    goto Cmd;

                case "stop":
                    Running = false;
                    goto Cmd;

                case "exit":

                    goto End;

                default:

                    goto Cmd;
            }

        End:
            UserList.ToList().ForEach(
                Each =>
                {
                    if (Each.Value.Socket != null &&
                        Each.Value.Socket.IsAvailable)
                        Each.Value.Socket.Close();
                    Each.Value.Socket = null;
                }
            );
            Running = false;
        }

        static void doThread()
        {
            int CountDown = 0;
            var Date = DateTime.Now;
            while (CountDown < Const.Timer && Running)
            {
                StocksPrice = "RefreshPrice|" + Date.ToString("yyyy-MM-dd");

                StockList.ForEach((EachStock) =>
                {
                    if (EachStock.Delisting)
                    {
                        StocksPrice += $"|{EachStock.Name}|0";
                        EachStock.Add(Date.ToString("yyyy-MM-dd"), 0);
                        return;
                    }

                    int Value = (int)Utils.GetValue(1, 101);

                    if (Const.None - EachStock.Up < Value && Value <= Const.UP - EachStock.Down + EachStock.Up)
                    {
                        EachStock.DownF = 1;
                        EachStock.UpF++;

                        if (EachStock.Up > 0)
                        {
                            EachStock.Up--;
                            EachStock.Down++;
                        }
                        else
                        {
                            EachStock.Up = EachStock.RandomConst * 2;
                            EachStock.Down = 0;
                        }

                        EachStock.Price += Utils.CalcPrice(EachStock.UpF, Utils.GetValue(30, 80, 1000f));
                    }
                    else if (Const.UP - EachStock.Down + EachStock.Up < Value && Value <= Const.DOWN - EachStock.HighlyUp)
                    {
                        EachStock.UpF = 1;
                        EachStock.DownF++;

                        if (EachStock.Down > 0)
                        {
                            EachStock.Up++;
                            EachStock.Down--;
                        }
                        else
                        {
                            EachStock.Down = EachStock.RandomConst;
                            EachStock.Up = 0;
                        }

                        EachStock.Price -= Utils.CalcPrice(EachStock.DownF, Utils.GetValue(30, 60, 1000f));
                    }
                    else if (Const.DOWN - EachStock.HighlyUp < Value && Value <= Const.HighlyUP - EachStock.HighlyDown)
                    {
                        EachStock.Up++;
                        EachStock.Down--;
                        EachStock.HighlyDown = 0;
                        EachStock.HighlyUp++;

                        EachStock.Price += Utils.CalcPrice(1, Utils.GetValue(150, 450, 1000f));
                    }
                    else if (Const.HighlyUP - EachStock.HighlyDown < Value && Value <= Const.HighlyDOWN)
                    {
                        EachStock.Up--;
                        EachStock.Down++;
                        EachStock.HighlyDown++;
                        EachStock.HighlyUp = 0;

                        EachStock.Price -= Utils.CalcPrice(1, Utils.GetValue(150, 400, 1000f));
                    }

                    if (EachStock.HighlyDown > Const.HighlyDOWN - Const.HighlyUP)
                    {
                        EachStock.HighlyDown = 0;
                        EachStock.HighlyUp = 5;
                        EachStock.Up += 3;
                        EachStock.Down -= 3;
                    }

                    if (EachStock.Price <= Const.DelistingPrice)
                    {
                        EachStock.Price = 0;
                        EachStock.Delisting = true;
                        Logger.Write(string.Format("[Server] {0}이(가) 상장폐지됨 ({1}초)", // 거래 중지 시키기
                            EachStock.Name,
                            CountDown
                        ));
                    }

                    if (EachStock.InitCount >= Const.InitCount)
                    {
                        EachStock.Up = 0;
                        EachStock.Down = 0;

                        EachStock.UpF = 2;
                        EachStock.DownF = 1;
                        EachStock.HighlyUp = 0;
                        EachStock.HighlyDown = 0;
                        EachStock.InitCount = 0;
                    }
                    else
                    {
                        EachStock.InitCount++;
                    }

                    EachStock.Price = (int)(EachStock.Price / 100) * 100; // 100원 단위로 끊기
                    StocksPrice += $"|{EachStock.Name}|{EachStock.Price.ToString()}";
                    EachStock.Add(Date.ToString("yyyy-MM-dd"), EachStock.Price);
                });

                try
                {
                    UserList.ToList().ForEach(
                        Each =>
                        {
                            if (Each.Value.Socket != null &&
                                Each.Value.Socket.IsAvailable)
                                Each.Value.Socket.Send(StocksPrice);
                        });
                }
                catch (SocketException se)
                {
                    Logger.Write("[SocketException_MainLoop]");
                    Logger.Write(se.Message);
                }
                catch (Exception ex)
                {
                    Logger.Write("[Exception_MainLoop]");
                    Logger.Write(ex.Message);
                }

                Date = Date.AddDays(1);
                CountDown++;
                Thread.Sleep(Const.RefreshDelay);
            }

            Logger.Write("[Server] Loop End (End Time)");
            // 순위 계산

            var UserGrade = new Dictionary<string, int>();

            UserList.ToList().ForEach((Each) =>
            {
                Each.Value.Stock.ToList().ForEach((StockEach) =>
                {
                    StockList.ForEach(
                        EachStockList =>
                        {
                            if (EachStockList.Name == StockEach.Key)
                            {
                                Each.Value.SellStock(StockEach.Key, EachStockList.Price, StockEach.Value);
                                return;
                            }
                        });
                });

                UserGrade.Add(Each.Value.Name, Each.Value.Point);
            });
            
            // 이상함. 수정필요.

            Logger.Write("[==========순위==========]");

            int cc = 1;
            var GG = from entry in UserGrade orderby entry.Value descending select entry;

            GG.ToList().ForEach(User =>
            {
                if (UserList[User.Key].Socket != null)
                {
                    UserList[User.Key].Socket.Send("EndGame|" + cc + "|" + Utils.GetConv(User.Value));
                    UserList[User.Key].Socket.Close();
                    UserList[User.Key].Socket = null;
                }

                Logger.Write(cc + "위 " + User.Key + " " + Utils.GetConv(User.Value));

                cc++;
            });

            Running = false;
            StockList.Clear();
            UserList.Clear();

            Logger.Write("[==========종료==========]");
        }
    }
}