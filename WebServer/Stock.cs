using System.Text;

namespace WebServer
{
    public class Stock
    {
        public string Name;
        public int Price;
        public int RandomConst;
        public int InitCount;

        public int Up;
        public int Down;
        public int HighlyUp;
        public int HighlyDown;

        public int UpF;
        public int DownF;

        public bool Delisting = false;

        public StringBuilder StockLog = new StringBuilder();

        public Stock(string name, int price, int randomConst)
        {
            this.Name = name;
            this.Price = price;
            this.RandomConst = randomConst;
        }

        public void Add(string date, int price)
        {
            //Logger.Write(StockLog.ToString());
            if(StockLog.Length > 0)
                StockLog.Append(", { \"time\": \"" + date + "\", \"value\": " + price + " }");
            else 
                StockLog.Append("{ \"time\": \"" + date + "\", \"value\": " + price + " }");
        }

    }
}
