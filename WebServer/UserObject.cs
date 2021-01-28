using System.Collections.Generic;
using Fleck;

namespace WebServer
{
    public class UserObject
    {
        public bool GetPrice = false;
        public string Name;
        public int Grade;
        public int Point;
        public IWebSocketConnection Socket;
        public Dictionary<string, int> Stock = new Dictionary<string, int>();

        public UserObject(string Name, int Point, IWebSocketConnection Socket)
        {
            this.Name = Name;
            this.Point = Point;
            this.Socket = Socket;
        }

        public void BuyStock(string Name, int Price, int Count)
        {
            Point -= Price * Count;

            if (Stock.ContainsKey(Name))
            {
                Stock[Name] += Count;
            }
            else
            {
                Stock.Add(Name, Count);
            }
        }

        public void SellStock(string Name, int Price, int Count)
        {
            Point += Price * Count;

            if (Stock.ContainsKey(Name))
            {
                Stock[Name] -= Count;
            }
        }
    }
}