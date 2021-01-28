using System;

namespace WebServer
{
    public class Logger
    {
        public static void Write(string Text, params object[] Format)
        {
            Console.WriteLine("[{0}] {1}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"), string.Format(Text, Format));
        }
        public static void Write(string Text)
        {
            Console.WriteLine("[{0}] {1}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"), Text);
        }
    }
}
