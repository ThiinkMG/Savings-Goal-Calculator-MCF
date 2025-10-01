import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle } from "lucide-react";

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactSupportModal({ isOpen, onClose }: ContactSupportModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] p-0">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageCircle className="w-5 h-5 text-brand-blue" />
            Contact Support
          </DialogTitle>
          <DialogDescription className="sr-only">
            Contact our support team for help with the Savings Goal Calculator
          </DialogDescription>
        </DialogHeader>
        
        <div className="w-full h-[calc(95vh-4rem)] sm:h-[600px] overflow-hidden">
          <iframe 
            src="https://docs.google.com/forms/d/e/1FAIpQLScYaEGpSP3GsvLPWMx4yAk-uckDCG32HqoXYgtzh4npLDPjNw/viewform?embedded=true" 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            marginHeight={0} 
            marginWidth={0}
            className="w-full h-full"
          >
            Loading…
          </iframe>
        </div>
      </DialogContent>
    </Dialog>
  );
}