using System;
using System.Net.Sockets;
using System.Text;
using Fleck;

namespace WebServer
{
    public class Utils
    {
        public static bool IsWinning(int Percentage)
        {
            return new Random().Next(1, 101) <= Percentage;
        }

        public static int Price(int Min = 1500, int Max = 2000, int Multiple = 10)
        {
            return (int)((new Random().Next(Min, Max) * Multiple) / 100) * 100;
        }

        public static int CalcPrice(int Frequency, float Probability)
        {
            return (int)(Frequency * Const.Base * Probability * 2.3f);
        }

        public static float GetValue(int Min, int Max, float Div = 1)
        {
            return new Random().Next(Min, Max) / Div;
        }

        public static string GetConv(int Point)
        {
            return string.Format("{0:#,###}", Point) + "원";
        }
    }
}
